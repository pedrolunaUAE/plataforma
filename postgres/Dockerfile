FROM postgis/postgis:17-3.5

# La imagen fija Debian 11 en una fecha. El repositorio vivo ya no
# conserva esos paquetes, y bullseye-pgdg salió de apt.postgresql.org.
RUN printf '%s\n' \
      'deb http://snapshot.debian.org/archive/debian/20250721T000000Z bullseye main' \
      'deb http://snapshot.debian.org/archive/debian-security/20250721T000000Z bullseye-security main' \
      'deb http://snapshot.debian.org/archive/debian/20250721T000000Z bullseye-updates main' \
      > /etc/apt/sources.list \
 && printf '%s\n' \
      'deb [signed-by=/usr/local/share/keyrings/postgres.gpg.asc] http://apt-archive.postgresql.org/pub/repos/apt bullseye-pgdg main' \
      > /etc/apt/sources.list.d/pgdg.list \
 && printf '%s\n' 'Acquire::Check-Valid-Until "false";' > /etc/apt/apt.conf.d/99no-check-valid \
 && apt-get update \
 && apt-get install -y --no-install-recommends \
      postgresql-17-plr \
      r-cran-foreign \
      r-cran-jsonlite \
 && rm -rf /var/lib/apt/lists/*
