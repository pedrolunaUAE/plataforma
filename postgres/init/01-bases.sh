#!/bin/bash
set -eu

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname postgres <<SQL
DO \$\$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = '${OVIE_DB_USER}') THEN
    CREATE ROLE ${OVIE_DB_USER} LOGIN PASSWORD '${OVIE_DB_PASSWORD}';
  END IF;
END
\$\$;
SQL

exists=$(psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname postgres -tAc "SELECT 1 FROM pg_database WHERE datname = '${OVIE_DB_NAME}'")
if [ "$exists" != "1" ]; then
  psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname postgres -c "CREATE DATABASE ${OVIE_DB_NAME} OWNER ${OVIE_DB_USER}"
fi

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "${OVIE_DB_NAME}" -c "CREATE EXTENSION IF NOT EXISTS postgis"

exists=$(psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname postgres -tAc "SELECT 1 FROM pg_database WHERE datname = 'iplanay'")
if [ "$exists" != "1" ]; then
  psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname postgres -c "CREATE DATABASE iplanay OWNER ${POSTGRES_USER}"
fi

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname iplanay -c "CREATE EXTENSION IF NOT EXISTS postgis"
