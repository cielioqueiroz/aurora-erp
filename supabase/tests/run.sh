#!/bin/sh
# Ensaia as migrations e as RPCs de pedido contra um Postgres real, em container.
# Uso, a partir da raiz do repo:  sh supabase/tests/run.sh
#
# Cada execução recria o banco do zero: shim de auth, as migrations em ordem,
# o seed de permissions/roles e as validações. Não toca em Supabase nenhum.

set -e
export MSYS_NO_PATHCONV=1

CONTAINER=${CONTAINER:-aurora-pg-test}
IMAGE=${IMAGE:-postgres:15-alpine}

if [ ! -f supabase/migrations/0001_init_multitenancy.sql ]; then
  echo "Rode a partir da raiz do repo." >&2
  exit 1
fi

if ! docker info >/dev/null 2>&1; then
  echo "O daemon do Docker não responde. Suba o Docker Desktop antes." >&2
  exit 1
fi

if ! docker ps -a --format '{{.Names}}' | grep -qx "$CONTAINER"; then
  docker run -d --name "$CONTAINER" \
    -e POSTGRES_PASSWORD=aurora -e POSTGRES_DB=aurora "$IMAGE" >/dev/null
fi
docker start "$CONTAINER" >/dev/null 2>&1 || true

tries=0
until docker exec "$CONTAINER" pg_isready -U postgres >/dev/null 2>&1; do
  tries=$((tries + 1))
  [ "$tries" -gt 60 ] && { echo "Postgres não ficou pronto." >&2; exit 1; }
  sleep 1
done

docker exec "$CONTAINER" rm -rf /sql
docker exec "$CONTAINER" mkdir -p /sql
docker cp supabase "$CONTAINER":/sql/supabase >/dev/null

psql_file() {
  docker exec -e PGOPTIONS='--client-min-messages=warning' "$CONTAINER" \
    psql -v ON_ERROR_STOP=1 -U postgres -d aurora -q -f "$1" >/tmp/aurora-psql.out 2>&1
}

docker exec "$CONTAINER" psql -U postgres -d postgres -q \
  -c "drop database if exists aurora with (force);" -c "create database aurora;"

psql_file /sql/supabase/tests/00_bootstrap.sql \
  || { echo "bootstrap FALHOU"; head -15 /tmp/aurora-psql.out; exit 1; }

for f in $(docker exec "$CONTAINER" sh -c "ls /sql/supabase/migrations/*.sql" | tr -d '\r'); do
  psql_file "$f" || { echo "FALHOU: $f"; head -20 /tmp/aurora-psql.out; exit 1; }
done

psql_file /sql/supabase/seeds/0001_permissions_and_roles.sql \
  || { echo "seed FALHOU"; head -15 /tmp/aurora-psql.out; exit 1; }

echo "schema pronto: shim + migrations + seed"
echo

status=0
docker exec "$CONTAINER" psql -v ON_ERROR_STOP=1 -U postgres -d aurora -q \
  -f /sql/supabase/tests/orders_rpc_test.sql >/tmp/aurora-test.out 2>&1 || status=$?

grep -E "NOTICE:|ERROR:|FALHOU|VALIDACOES|PASSARAM" /tmp/aurora-test.out \
  | sed 's/^psql:[^ ]* //;s/^NOTICE:  //'

exit $status
