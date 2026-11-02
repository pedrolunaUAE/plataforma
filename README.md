# Plataforma

Un servidor web y una base PostgreSQL/PostGIS para varios proyectos.
Cada aplicacion sigue en su carpeta y en su contenedor.

## Repositorio

Este Git guarda la infraestructura compartida, la clase y el proyecto IPLANAY.
OVIE, MxSIG y el cliente del geovisor tienen su propio Git y no se versionan aqui.

| Carpeta | Origen |
| --- | --- |
| `proyectos/ovie` | https://github.com/pedrolunaUAE/OVIE |
| `proyectos/mxsig` | https://git.inegi.org.mx/mxsig/mxsig |
| `proyectos/iplanay/geovisor` | https://git.inegi.org.mx/mxsig/mxsig_client mas el overlay |

Despues de clonar este repositorio:

```cmd
powershell -File scripts\clonar-dependencias.ps1
```

El script clona las tres carpetas solo si aun no existen. Si el geovisor se clono en esa ejecucion, copia `proyectos/iplanay/geovisor-overlay` encima del cliente. Para volver a copiar el overlay a mano:

```cmd
powershell -File scripts\aplicar-overlay-geovisor.ps1
```

No entran al repositorio el archivo `.env`, los Excel de `datos/`, los PDF de `proyectos/iplanay/PDFs/` ni el mapfile con la contraseña. La plantilla es `proyectos/iplanay/map/vector_iplanay.map.example`. El detalle esta en `docs/datos.md`.

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

Los proyectos estan en `proyectos\ovie`, `proyectos\mxsig`, `proyectos\iplanay` y `proyectos\clase`. La clase ya no
tiene contenedor: sus tablas estan en la base `base_fundamentos`.

Si MxSIG va a usar el puerto 80, cambia WEB_PORT en .env.

## Sumar un proyecto

1. Crear su base en postgres/init, del mismo modo que ovie.
2. Agregar un archivo en nginx/conf.d con su server_name.
3. Poner su carpeta en proyectos y unir su API a la red externa plataforma.
