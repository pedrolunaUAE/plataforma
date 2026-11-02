# Datos locales

Estos archivos se quedan en la maquina de trabajo. No entran al repositorio.

## Excel de Nayarit

- `datos/18_Nayarit.zip`
- `datos/18_Nayarit/Nayarit_Datos generales.xlsx`
- `datos/18_Nayarit/microdatos_economicos_colonias_Nayarit.xlsx`
- `datos/18_Nayarit/microdatos_economicos_manzana_Nayarit.xlsx`

## Cuadernillos

Los PDF municipales estan en el repo de IPLANAY, en `proyectos/iplanay/PDFs/`. Su contenedor los monta en `/pdfs`.

## Mapfile

`proyectos/iplanay/map/vector_iplanay.map` lleva la contraseña de Postgres y queda fuera del repo de IPLANAY. La plantilla es `vector_iplanay.map.example`. Para usarla, copiala a `vector_iplanay.map` y sustituye `CAMBIAR_ESTA_CONTRASENA` por `POSTGRES_PASSWORD` del `.env`.
