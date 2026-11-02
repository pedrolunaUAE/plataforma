# Plataforma

Un servidor web y una base PostgreSQL/PostGIS para varios proyectos.
Cada aplicacion sigue en su carpeta y en su contenedor.

## Repositorio

Este Git guarda la infraestructura compartida y la clase.
OVIE, IPLANAY y MxSIG tienen su propio Git y su propio contenedor.

| Carpeta | Origen |
| --- | --- |
| `proyectos/ovie` | https://github.com/pedrolunaUAE/OVIE |
| `proyectos/iplanay` | https://github.com/pedrolunaUAE/iplanay |
| `proyectos/mxsig` | https://git.inegi.org.mx/mxsig/mxsig |

Despues de clonar este repositorio:

```cmd
powershell -File scripts\clonar-dependencias.ps1
```

El script clona las tres carpetas solo si aun no existen. El de IPLANAY, ademas, clona el cliente del mapa. No entran aqui el archivo `.env` ni los Excel de `datos/`. El detalle esta en `docs/datos.md`.

## Arranque

```cmd
cd /d D:\ws\plataforma
docker compose up -d
```

- Sitio de entrada: http://localhost/
- OVIE: http://localhost/ovie/
- Postgres desde Windows: localhost:5433 (usuario postgres, base ovie)
- pgAdmin: http://localhost/pgadmin/ (correo y contraseña en .env)

El contenedor `proxy` es el unico que publica el puerto 80. La web y pgAdmin
no abren puertos en Windows.

MxSIG se abre en http://localhost/geovisor/. Tomcat, MapServer y la API se levantan aparte:

```cmd
cd /d D:\ws\plataforma\proyectos\mxsig
docker compose up -d --build
```

OVIE se abre en http://localhost/ovie/. Su API se levanta aparte:

```cmd
cd /d D:\ws\plataforma\proyectos\ovie
docker compose up -d
```

IPLANAY se abre en http://localhost/iplanay/. Su API se levanta aparte:

```cmd
cd /d D:\ws\plataforma\proyectos\iplanay
powershell -File arrancar.ps1
```

Los proyectos estan en `proyectos\ovie`, `proyectos\mxsig`, `proyectos\iplanay` y `proyectos\clase`. La clase ya no
tiene contenedor: sus tablas estan en la base `base_fundamentos`.

Si MxSIG va a usar el puerto 80, cambia WEB_PORT en .env.

El visor de IPLANAY entra a Postgres con `iplanay_lectura`, que solo lee la base `iplanay`. La contraseña es `IPLANAY_DB_PASSWORD` en `.env`. En el primer arranque el script `postgres/init/02-iplanay-lectura.sh` crea ese usuario. Si los esquemas se cargan despues, hay que volver a ejecutar ese script dentro de `plataforma-postgres`.

## Sumar un proyecto

1. Crear su base en postgres/init, del mismo modo que ovie.
2. Agregar un archivo en nginx/conf.d con su server_name.
3. Poner su carpeta en proyectos y unir su API a la red externa plataforma.
