#!/bin/bash
# Usuario de solo lectura para el visor. Se puede volver a ejecutar
# despues de crear los esquemas de iplanay.
set -eu

: "${POSTGRES_USER:?}"
: "${IPLANAY_DB_PASSWORD:?}"

pwd_sql=${IPLANAY_DB_PASSWORD//\'/\'\'}

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname postgres <<SQL
DO \$\$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'iplanay_lectura') THEN
    CREATE ROLE iplanay_lectura
      LOGIN PASSWORD '${pwd_sql}'
      NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT
      CONNECTION LIMIT 20;
  ELSE
    ALTER ROLE iplanay_lectura WITH
      LOGIN PASSWORD '${pwd_sql}'
      NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT
      CONNECTION LIMIT 20;
  END IF;
END
\$\$;

ALTER ROLE iplanay_lectura SET statement_timeout = '60s';

DO \$\$
DECLARE
  nombre text;
BEGIN
  FOREACH nombre IN ARRAY ARRAY['postgres', 'iplanay', 'ovie', 'base_fundamentos', 'compostela']
  LOOP
    IF EXISTS (SELECT 1 FROM pg_database WHERE datname = nombre) THEN
      EXECUTE format('REVOKE CONNECT ON DATABASE %I FROM PUBLIC', nombre);
    END IF;
  END LOOP;
END
\$\$;

GRANT CONNECT ON DATABASE iplanay TO iplanay_lectura;
SQL

existe=$(psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname postgres -tAc "SELECT 1 FROM pg_database WHERE datname = 'ovie'")
if [ "$existe" = "1" ]; then
  psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname postgres -c "GRANT CONNECT ON DATABASE ovie TO ovie"
fi

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname iplanay <<'SQL'
DO $$
DECLARE
  esquema text;
BEGIN
  FOREACH esquema IN ARRAY ARRAY['mg', 'sociedad', 'economia', 'gobierno', 'general', 'catalogo']
  LOOP
    IF EXISTS (SELECT 1 FROM pg_namespace WHERE nspname = esquema) THEN
      EXECUTE format('GRANT USAGE ON SCHEMA %I TO iplanay_lectura', esquema);
      EXECUTE format('GRANT SELECT ON ALL TABLES IN SCHEMA %I TO iplanay_lectura', esquema);
      EXECUTE format(
        'ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA %I GRANT SELECT ON TABLES TO iplanay_lectura',
        esquema
      );
    END IF;
  END LOOP;

  IF EXISTS (
    SELECT 1
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relname = 'spatial_ref_sys'
  ) THEN
    GRANT USAGE ON SCHEMA public TO iplanay_lectura;
    GRANT SELECT ON TABLE public.spatial_ref_sys TO iplanay_lectura;
  END IF;
END
$$;
SQL
