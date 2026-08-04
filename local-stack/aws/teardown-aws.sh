#!/usr/bin/env bash
# Delete EVERY AWS resource created by deploy-aws.sh. Run when abandoning or
# rebuilding staging so nothing keeps billing.
set -uo pipefail
cd "$(dirname "$0")"
export AWS_REGION="${AWS_REGION:-ca-central-1}"
P=autochart-trust-staging
source .state 2>/dev/null || true
ACCOUNT=$(aws sts get-caller-identity --query Account --output text)

echo "== App Runner =="
ARN=$(aws apprunner list-services --query "ServiceSummaryList[?ServiceName=='$P'].ServiceArn" --output text)
[ -n "$ARN" ] && aws apprunner delete-service --service-arn "$ARN" >/dev/null && echo "  deleted service"

echo "== CodeBuild =="
for prj in "$P-image" "$P-migrate"; do aws codebuild delete-project --name "$prj" 2>/dev/null && echo "  deleted $prj"; done

echo "== RDS (no final snapshot) =="
aws rds delete-db-instance --db-instance-identifier "$P" --skip-final-snapshot --delete-automated-backups >/dev/null 2>&1 && echo "  deleting RDS (async)"

echo "== ECR =="
aws ecr delete-repository --repository-name "$P" --force >/dev/null 2>&1 && echo "  deleted repo"

echo "== S3 buckets =="
for b in "$P-source-$ACCOUNT" "$P-assets-$ACCOUNT" "$P-uploads-$ACCOUNT"; do
  aws s3 rb "s3://$b" --force >/dev/null 2>&1 && echo "  deleted $b"
done

echo "== IAM =="
for r in "$P-codebuild" "$P-apprunner-ecr"; do
  for pol in $(aws iam list-attached-role-policies --role-name "$r" --query 'AttachedPolicies[].PolicyArn' --output text 2>/dev/null); do
    aws iam detach-role-policy --role-name "$r" --policy-arn "$pol"; done
  aws iam delete-role --role-name "$r" 2>/dev/null && echo "  deleted role $r"
done
for k in $(aws iam list-access-keys --user-name "$P-app" --query 'AccessKeyMetadata[].AccessKeyId' --output text 2>/dev/null); do
  aws iam delete-access-key --user-name "$P-app" --access-key-id "$k"; done
aws iam delete-user-policy --user-name "$P-app" --policy-name s3-app 2>/dev/null
aws iam delete-user --user-name "$P-app" 2>/dev/null && echo "  deleted user $P-app"

echo "== Security group (after RDS finishes deleting) =="
aws rds wait db-instance-deleted --db-instance-identifier "$P" 2>/dev/null
[ -n "${DB_SG:-}" ] && aws ec2 delete-security-group --group-id "$DB_SG" 2>/dev/null && echo "  deleted SG"

rm -f .state
echo "Teardown complete — nothing left billing."
