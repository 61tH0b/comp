#!/usr/bin/env bash
# Bring up the full local trust-center stack (idempotent). No Docker.
set -u
PGBIN=/usr/lib/postgresql/16/bin
DATA=/root/local-stack-data
PGDATA=/home/pg/data/pg
export DATABASE_URL="postgresql://compai@127.0.0.1:5433/compai?schema=public"
mkdir -p "$DATA/logs"

echo "== Postgres =="
# NB: log must live under /home/pg (the pg user cannot write inside /root),
# and pg_isready must pass a real role (-U compai), not the OS user name.
PGLOG=/home/pg/data/logs/pg.log
if ! $PGBIN/pg_isready -h 127.0.0.1 -p 5433 -U compai >/dev/null 2>&1; then
  rm -f "$PGDATA/postmaster.pid"
  su pg -c "$PGBIN/pg_ctl -D $PGDATA -l $PGLOG -o '-p 5433 -k /tmp -c listen_addresses=127.0.0.1' start" || {
    echo "  pg_ctl failed; log tail:"; tail -5 "$PGLOG"; }
  sleep 2
fi
$PGBIN/pg_isready -h 127.0.0.1 -p 5433 -U compai && echo "  PG ready"

echo "== Redis =="
redis-cli -p 6380 ping >/dev/null 2>&1 || redis-server --port 6380 --dir "$DATA/redis" --daemonize yes --logfile "$DATA/logs/redis.log" --save ""
sleep 1; redis-cli -p 6380 ping

echo "== MinIO =="
if ! curl -s -o /dev/null http://127.0.0.1:9000/minio/health/live; then
  MINIO_ROOT_USER=compai MINIO_ROOT_PASSWORD=compai12345 nohup "$DATA/minio/minio" server "$DATA/minio/data" \
    --address 127.0.0.1:9000 --console-address 127.0.0.1:9001 > "$DATA/logs/minio.log" 2>&1 &
  sleep 4
fi
curl -s -o /dev/null -w "  MinIO %{http_code}\n" http://127.0.0.1:9000/minio/health/live

echo "== Trust API (:3333) =="
fuser -k 3333/tcp 2>/dev/null; sleep 1
setsid nohup bash "$(dirname "$0")/start-trust-api.sh" > "$DATA/logs/trust-api.log" 2>&1 < /dev/null &
for i in $(seq 1 25); do
  [ "$(curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:3333/v1/trust-access/autochart/frameworks 2>/dev/null)" = "200" ] && { echo "  API up"; break; }; sleep 1
done

echo "== Trust Center frontend (:3003) =="
fuser -k 3003/tcp 2>/dev/null; sleep 1
setsid nohup bash "$(dirname "$0")/start-trust-center.sh" > "$DATA/logs/trust-center.log" 2>&1 < /dev/null &
for i in $(seq 1 40); do
  [ "$(curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:3003/ 2>/dev/null)" = "200" ] && { echo "  Frontend up"; break; }; sleep 1
done
echo "Done."
