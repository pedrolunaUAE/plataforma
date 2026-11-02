# Overlay del geovisor IPLANAY

Cambios propios sobre el cliente MxSIG. Estos archivos se copian encima de un clone de `mxsig_client` y dejan el visor de cuadernillos.

La base es el commit `e0c22b375eb93e3e551c4a2e2a810fe4d7c99f4d` de https://git.inegi.org.mx/mxsig/mxsig_client (rama `main`).

`scripts/aplicar-overlay-geovisor.ps1` hace la copia hacia `proyectos/iplanay/geovisor`. Ese directorio no se versiona aqui: sigue siendo el clone de INEGI mas este overlay.

Quedaron fuera a proposito:

- el arbol borrado de `js/frameworks/OpenLayers/lib` y los builds de depuracion
- copias con nombre `estable`, `copia`, `(1)` o `(2)`
- `map_.js`, `mapDownload_.js` y `ui_estable con pestañas.js`

`OpenLayers.js` si entra. El cambio evita un fallo al quitar capas y permite usar la rueda del mouse sobre el mapa.
