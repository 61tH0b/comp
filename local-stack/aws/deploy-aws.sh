#!/usr/bin/env bash
# Deploy the trust-center BACKEND to AWS (staging). No DNS / public site changes.
# Stages: infra | build | migrate | app | smoke   (no arg = all, in order)
# State (ids, generated secrets) is kept in local-stack/aws/.state (gitignored).
set -euo pipefail
cd "$(dirname "$0")"

export AWS_REGION="${AWS_REGION:-ca-central-1}"
P=autochart-trust-staging               # project tag/name prefix
STATE=.state
touch "$STATE"; source "$STATE" 2>/dev/null || true
ACCOUNT=$(aws sts get-caller-identity --query Account --output text)
TAGS="Key=project,Value=$P"

save() { grep -q "^export $1=" "$STATE" 2>/dev/null && sed -i "s|^export $1=.*|export $1=\"$2\"|" "$STATE" || echo "export $1=\"$2\"" >> "$STATE"; }

infra() {
  echo "== [infra] S3 buckets =="
  for b in "$P-source-$ACCOUNT" "$P-assets-$ACCOUNT" "$P-uploads-$ACCOUNT"; do
    aws s3api head-bucket --bucket "$b" 2>/dev/null || \
      aws s3api create-bucket --bucket "$b" \
        --create-bucket-configuration LocationConstraint="$AWS_REGION"
    aws s3api put-public-access-block --bucket "$b" --public-access-block-configuration \
      BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true
  done
  save SRC_BUCKET "$P-source-$ACCOUNT"; save ASSETS_BUCKET "$P-assets-$ACCOUNT"; save UPLOADS_BUCKET "$P-uploads-$ACCOUNT"

  echo "== [infra] ECR repo =="
  aws ecr describe-repositories --repository-names "$P" >/dev/null 2>&1 || \
    aws ecr create-repository --repository-name "$P" --tags $TAGS >/dev/null
  save ECR_URI "$ACCOUNT.dkr.ecr.$AWS_REGION.amazonaws.com/$P"

  echo "== [infra] RDS security group =="
  VPC=$(aws ec2 describe-vpcs --filters Name=isDefault,Values=true --query 'Vpcs[0].VpcId' --output text)
  SG=$(aws ec2 describe-security-groups --filters Name=group-name,Values="$P-db" Name=vpc-id,Values="$VPC" \
        --query 'SecurityGroups[0].GroupId' --output text 2>/dev/null)
  if [ "$SG" = "None" ] || [ -z "$SG" ]; then
    SG=$(aws ec2 create-security-group --group-name "$P-db" --description "staging RDS for $P" \
          --vpc-id "$VPC" --query GroupId --output text)
    # Staging-only: open 5432 (TLS + strong password). Tighten to App Runner VPC connector later.
    aws ec2 authorize-security-group-ingress --group-id "$SG" --protocol tcp --port 5432 --cidr 0.0.0.0/0
  fi
  save DB_SG "$SG"

  echo "== [infra] RDS Postgres (db.t4g.micro) =="
  if [ -z "${DB_PASSWORD:-}" ]; then DB_PASSWORD=$(openssl rand -hex 24); save DB_PASSWORD "$DB_PASSWORD"; fi
  if ! aws rds describe-db-instances --db-instance-identifier "$P" >/dev/null 2>&1; then
    aws rds create-db-instance --db-instance-identifier "$P" \
      --db-instance-class db.t4g.micro --engine postgres --engine-version 16 \
      --master-username compai --master-user-password "$DB_PASSWORD" \
      --allocated-storage 20 --db-name compai --publicly-accessible \
      --vpc-security-group-ids "$SG" --backup-retention-period 1 \
      --tags $TAGS >/dev/null
  fi
  echo "  waiting for RDS to become available (can take ~10 min)..."
  aws rds wait db-instance-available --db-instance-identifier "$P"
  EP=$(aws rds describe-db-instances --db-instance-identifier "$P" \
        --query 'DBInstances[0].Endpoint.Address' --output text)
  save DB_HOST "$EP"
  save DATABASE_URL "postgresql://compai:$DB_PASSWORD@$EP:5432/compai?schema=public&sslmode=require"
  echo "  RDS: $EP"
}

build() {
  source "$STATE"
  echo "== [build] zip source -> s3://$SRC_BUCKET =="
  (cd ../.. && git archive --format=zip -o /tmp/$P-src.zip HEAD)
  aws s3 cp /tmp/$P-src.zip "s3://$SRC_BUCKET/src.zip" --no-progress

  echo "== [build] CodeBuild role + project =="
  if ! aws iam get-role --role-name "$P-codebuild" >/dev/null 2>&1; then
    aws iam create-role --role-name "$P-codebuild" --tags $TAGS --assume-role-policy-document '{
      "Version":"2012-10-17","Statement":[{"Effect":"Allow","Principal":{"Service":"codebuild.amazonaws.com"},"Action":"sts:AssumeRole"}]}' >/dev/null
    aws iam attach-role-policy --role-name "$P-codebuild" --policy-arn arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryPowerUser
    aws iam attach-role-policy --role-name "$P-codebuild" --policy-arn arn:aws:iam::aws:policy/AmazonS3ReadOnlyAccess
    aws iam attach-role-policy --role-name "$P-codebuild" --policy-arn arn:aws:iam::aws:policy/CloudWatchLogsFullAccess
    sleep 10
  fi
  aws codebuild batch-get-projects --names "$P-image" --query 'projects[0].name' --output text 2>/dev/null | grep -q "$P-image" || \
  aws codebuild create-project --name "$P-image" --tags key=project,value=$P \
    --source "type=S3,location=$SRC_BUCKET/src.zip,buildspec=local-stack/aws/buildspec-image.yml" \
    --artifacts type=NO_ARTIFACTS \
    --environment "type=LINUX_CONTAINER,image=aws/codebuild/standard:7.0,computeType=BUILD_GENERAL1_MEDIUM,privilegedMode=true,environmentVariables=[{name=ECR_URI,value=$ECR_URI},{name=AWS_REGION,value=$AWS_REGION}]" \
    --service-role "arn:aws:iam::$ACCOUNT:role/$P-codebuild" >/dev/null

  echo "== [build] start image build =="
  BID=$(aws codebuild start-build --project-name "$P-image" --query 'build.id' --output text)
  echo "  build: $BID (waiting)"
  while :; do
    S=$(aws codebuild batch-get-builds --ids "$BID" --query 'builds[0].buildStatus' --output text); [ "$S" = "IN_PROGRESS" ] || break; sleep 20
  done
  [ "$S" = "SUCCEEDED" ] || { echo "  BUILD $S — logs: aws codebuild batch-get-builds --ids $BID"; exit 1; }
  echo "  image pushed: $ECR_URI:latest"
}

migrate() {
  source "$STATE"
  echo "== [migrate] prisma migrate deploy + seed via CodeBuild =="
  aws codebuild batch-get-projects --names "$P-migrate" --query 'projects[0].name' --output text 2>/dev/null | grep -q "$P-migrate" || \
  aws codebuild create-project --name "$P-migrate" --tags key=project,value=$P \
    --source "type=S3,location=$SRC_BUCKET/src.zip,buildspec=local-stack/aws/buildspec-migrate.yml" \
    --artifacts type=NO_ARTIFACTS \
    --environment "type=LINUX_CONTAINER,image=aws/codebuild/standard:7.0,computeType=BUILD_GENERAL1_SMALL,environmentVariables=[{name=DATABASE_URL,value=$DATABASE_URL},{name=APP_AWS_REGION,value=$AWS_REGION},{name=APP_AWS_ORG_ASSETS_BUCKET,value=$ASSETS_BUCKET}]" \
    --service-role "arn:aws:iam::$ACCOUNT:role/$P-codebuild" >/dev/null
  BID=$(aws codebuild start-build --project-name "$P-migrate" --query 'build.id' --output text)
  echo "  migrate run: $BID (waiting)"
  while :; do
    S=$(aws codebuild batch-get-builds --ids "$BID" --query 'builds[0].buildStatus' --output text); [ "$S" = "IN_PROGRESS" ] || break; sleep 15
  done
  [ "$S" = "SUCCEEDED" ] || { echo "  MIGRATE $S — check CodeBuild logs"; exit 1; }
}

app() {
  source "$STATE"
  echo "== [app] IAM user for S3 access (api reads keys from env) =="
  if [ -z "${APP_S3_KEY_ID:-}" ]; then
    aws iam get-user --user-name "$P-app" >/dev/null 2>&1 || aws iam create-user --user-name "$P-app" --tags $TAGS >/dev/null
    aws iam put-user-policy --user-name "$P-app" --policy-name s3-app --policy-document "{
      \"Version\":\"2012-10-17\",\"Statement\":[{\"Effect\":\"Allow\",\"Action\":\"s3:*\",
      \"Resource\":[\"arn:aws:s3:::$ASSETS_BUCKET\",\"arn:aws:s3:::$ASSETS_BUCKET/*\",\"arn:aws:s3:::$UPLOADS_BUCKET\",\"arn:aws:s3:::$UPLOADS_BUCKET/*\"]}]}"
    CRED=$(aws iam create-access-key --user-name "$P-app" --query 'AccessKey.[AccessKeyId,SecretAccessKey]' --output text)
    save APP_S3_KEY_ID "$(echo "$CRED" | cut -f1)"; save APP_S3_SECRET "$(echo "$CRED" | cut -f2)"
    source "$STATE"
  fi

  echo "== [app] App Runner ECR access role =="
  if ! aws iam get-role --role-name "$P-apprunner-ecr" >/dev/null 2>&1; then
    aws iam create-role --role-name "$P-apprunner-ecr" --tags $TAGS --assume-role-policy-document '{
      "Version":"2012-10-17","Statement":[{"Effect":"Allow","Principal":{"Service":"build.apprunner.amazonaws.com"},"Action":"sts:AssumeRole"}]}' >/dev/null
    aws iam attach-role-policy --role-name "$P-apprunner-ecr" --policy-arn arn:aws:iam::aws:policy/service-role/AWSAppRunnerServicePolicyForECRAccess
    sleep 10
  fi

  echo "== [app] App Runner service =="
  [ -n "${AUTH_SECRET:-}" ] || { AUTH_SECRET=$(openssl rand -hex 32); save AUTH_SECRET "$AUTH_SECRET"; }
  ENVVARS="{\"PORT\":\"3333\",\"DATABASE_URL\":\"$DATABASE_URL\",\"MOCK_EMAIL\":\"true\",\"MOCK_REDIS\":\"true\",\"MOCK_EMAIL_DIR\":\"/tmp\",\"TRUST_APP_URL\":\"https://staging.invalid\",\"BETTER_AUTH_URL\":\"https://staging.invalid\",\"BETTER_AUTH_SECRET\":\"$AUTH_SECRET\",\"RESEND_API_KEY\":\"re_placeholder\",\"RESEND_FROM_SYSTEM\":\"noreply@staging.invalid\",\"RESEND_FROM_DEFAULT\":\"hello@staging.invalid\",\"APP_AWS_REGION\":\"$AWS_REGION\",\"APP_AWS_ACCESS_KEY_ID\":\"$APP_S3_KEY_ID\",\"APP_AWS_SECRET_ACCESS_KEY\":\"$APP_S3_SECRET\",\"APP_AWS_BUCKET_NAME\":\"$UPLOADS_BUCKET\",\"APP_AWS_ORG_ASSETS_BUCKET\":\"$ASSETS_BUCKET\",\"APP_AWS_QUESTIONNAIRE_UPLOAD_BUCKET\":\"$UPLOADS_BUCKET\",\"APP_AWS_KNOWLEDGE_BASE_BUCKET\":\"$UPLOADS_BUCKET\",\"UPSTASH_REDIS_REST_URL\":\"http://localhost\",\"UPSTASH_REDIS_REST_TOKEN\":\"x\"}"
  if ! aws apprunner list-services --query "ServiceSummaryList[?ServiceName=='$P'].ServiceArn" --output text | grep -q arn; then
    aws apprunner create-service --service-name "$P" --tags $TAGS \
      --source-configuration "{\"ImageRepository\":{\"ImageIdentifier\":\"$ECR_URI:latest\",\"ImageRepositoryType\":\"ECR\",\"ImageConfiguration\":{\"Port\":\"3333\",\"StartCommand\":\"bun apps/api/trust-server.ts\",\"RuntimeEnvironmentVariables\":$ENVVARS}},\"AuthenticationConfiguration\":{\"AccessRoleArn\":\"arn:aws:iam::$ACCOUNT:role/$P-apprunner-ecr\"},\"AutoDeploymentsEnabled\":false}" \
      --instance-configuration '{"Cpu":"0.25 vCPU","Memory":"0.5 GB"}' >/dev/null
  fi
  ARN=$(aws apprunner list-services --query "ServiceSummaryList[?ServiceName=='$P'].ServiceArn" --output text)
  save SERVICE_ARN "$ARN"
  echo "  waiting for service..."
  while :; do
    S=$(aws apprunner describe-service --service-arn "$ARN" --query 'Service.Status' --output text)
    [ "$S" = "OPERATION_IN_PROGRESS" ] || break; sleep 20
  done
  URL=$(aws apprunner describe-service --service-arn "$ARN" --query 'Service.ServiceUrl' --output text)
  save API_URL "https://$URL"
  echo "  service $S: https://$URL"
}

smoke() {
  source "$STATE"
  echo "== [smoke] =="
  curl -sf "$API_URL/v1/trust-access/autochart/frameworks" | head -c 300; echo ""
  echo "OK — backend is live (no DNS touched)."
}

STAGE="${1:-all}"
case "$STAGE" in
  infra) infra ;; build) build ;; migrate) migrate ;; app) app ;; smoke) smoke ;;
  all) infra; build; migrate; app; smoke ;;
  *) echo "usage: $0 [infra|build|migrate|app|smoke|all]"; exit 1 ;;
esac
