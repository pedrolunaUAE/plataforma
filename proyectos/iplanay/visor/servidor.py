# Visor de los cuadernillos geoestadisticos.
# Sirve la interfaz y lee las capas y tablas de la base iplanay.

import json
import os
import re
import threading
from contextlib import contextmanager
from decimal import Decimal
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs, quote, urlparse

import psycopg
from psycopg.rows import dict_row

ROOT = Path(__file__).resolve().parent
PREFIJO = "/iplanay"


_cupo = threading.BoundedSemaphore(4)
_candado = threading.Lock()


class CupoLleno(Exception):
    pass


def cargar_env():
    if os.environ.get("IPLANAY_DB_PASSWORD") and os.environ.get("IPLANAY_DB_USER"):
        return
    ruta = ROOT.parent.parent.parent / ".env"
    if not ruta.is_file():
        return
    valores = {}
    for linea in ruta.read_text(encoding="utf-8").splitlines():
        linea = linea.strip()
        if not linea or linea.startswith("#") or "=" not in linea:
            continue
        clave, valor = linea.split("=", 1)
        valores[clave.strip()] = valor.strip().strip('"').strip("'")
    if valores.get("IPLANAY_DB_PASSWORD"):
        os.environ.setdefault("IPLANAY_DB_PASSWORD", valores["IPLANAY_DB_PASSWORD"])
    if valores.get("IPLANAY_DB_USER"):
        os.environ.setdefault("IPLANAY_DB_USER", valores["IPLANAY_DB_USER"])
    os.environ.setdefault("IPLANAY_DB_PORT", valores.get("POSTGRES_PORT", "5432"))
    os.environ.setdefault("IPLANAY_DB_NAME", "iplanay")


@contextmanager
def conectar():
    cargar_env()
    if not _cupo.acquire(timeout=2):
        raise CupoLleno()
    try:
        with psycopg.connect(
            host=os.environ.get("IPLANAY_DB_HOST", "127.0.0.1"),
            port=os.environ.get("IPLANAY_DB_PORT", "5433"),
            dbname=os.environ.get("IPLANAY_DB_NAME", "iplanay"),
            user=os.environ.get("IPLANAY_DB_USER", "iplanay_lectura"),
            password=os.environ.get("IPLANAY_DB_PASSWORD", ""),
            row_factory=dict_row,
            connect_timeout=8,
            options="-c default_transaction_read_only=on",
        ) as conn:
            yield conn
    finally:
        _cupo.release()


def json_default(valor):
    if isinstance(valor, Decimal):
        return float(valor)
    raise TypeError(f"no serializable: {type(valor)}")


def consulta(conn, sql):
    with conn.cursor() as cur:
        cur.execute(sql)
        return cur.fetchall()


def geojson(conn, sql):
    with conn.cursor() as cur:
        cur.execute(sql)
        fila = cur.fetchone()
    return fila["geojson"]


def cuadernillo_pdf(cvegeo):
    if not re.fullmatch(r"18\d{3}", cvegeo or ""):
        return None
    carpeta = Path(os.environ.get("IPLANAY_PDFS", "/pdfs"))
    prefijo = cvegeo[2:] + "_"
    for archivo in sorted(carpeta.glob(prefijo + "*.pdf")):
        ruta = archivo.resolve()
        if carpeta.resolve() in ruta.parents and ruta.is_file():
            return ruta
    return None


def municipio_en(x, y):
    with conectar() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT cvegeo, nomgeo,
                       ST_XMin(the_geom)::float8 AS xmin,
                       ST_YMin(the_geom)::float8 AS ymin,
                       ST_XMax(the_geom)::float8 AS xmax,
                       ST_YMax(the_geom)::float8 AS ymax
                FROM mg.municipio
                WHERE ST_Intersects(
                    the_geom,
                    ST_SetSRID(ST_MakePoint(%s, %s), 900913)
                )
                LIMIT 1
                """,
                (x, y),
            )
            return cur.fetchone()


def agrupar(filas):
    por_municipio = {}
    for fila in filas:
        cve = fila["cvegeo"]
        limpia = {k: v for k, v in fila.items() if k != "cvegeo"}
        por_municipio.setdefault(cve, []).append(limpia)
    return por_municipio


_geometria = None
_datos = None


def geometria_municipios():
    """Polígonos municipales en EPSG:900913, simplificados para el mapa temático."""
    global _geometria
    if _geometria is not None:
        return _geometria
    with _candado:
        if _geometria is not None:
            return _geometria
        _geometria = cargar_geometria()
        return _geometria


def cargar_geometria():
    sql = """
        SELECT json_build_object(
            'type', 'FeatureCollection',
            'features', COALESCE(json_agg(feat ORDER BY cvegeo), '[]'::json)
        ) AS geojson
        FROM (
            SELECT cvegeo,
                   json_build_object(
                       'type', 'Feature',
                       'geometry', ST_AsGeoJSON(ST_SimplifyPreserveTopology(the_geom, 80))::json,
                       'properties', json_build_object('cvegeo', cvegeo, 'nomgeo', nomgeo)
                   ) AS feat
            FROM mg.municipio
        ) municipios
    """
    with conectar() as conn:
        with conn.cursor() as cur:
            cur.execute(sql)
            fila = cur.fetchone()
    return fila["geojson"]


def datos():
    global _datos
    if _datos is not None:
        return _datos
    with _candado:
        if _datos is not None:
            return _datos
        _datos = cargar_datos()
        return _datos


def cargar_datos():
    capas = """
        SELECT json_build_object(
            'type', 'FeatureCollection',
            'features', COALESCE(json_agg(feat), '[]'::json)
        ) AS geojson
        FROM (
            SELECT json_build_object(
                'type', 'Feature',
                'geometry', ST_AsGeoJSON(
                    ST_SimplifyPreserveTopology(ST_Transform(the_geom, 4326), 0.002)
                )::json,
                'properties', json_build_object(
                    'cvegeo', cvegeo,
                    'nomgeo', nomgeo
                )
            ) AS feat
            FROM mg.municipio
            ORDER BY cvegeo
        ) municipios
    """
    localidades = """
        SELECT json_build_object(
            'type', 'FeatureCollection',
            'features', COALESCE(json_agg(feat), '[]'::json)
        ) AS geojson
        FROM (
            SELECT json_build_object(
                'type', 'Feature',
                'geometry', ST_AsGeoJSON(
                    ST_SimplifyPreserveTopology(ST_Transform(the_geom, 4326), 0.002)
                )::json,
                'properties', json_build_object(
                    'cvegeo', cvegeo,
                    'cve_municipio', cve_municipio,
                    'nomgeo', nomgeo,
                    'cabecera', cabecera
                )
            ) AS feat
            FROM mg.localidad
            ORDER BY cvegeo
        ) localidades
    """
    tablas = {
        "poblacion": "SELECT cvegeo, anio, hombres, mujeres, total, densidad_hab_km2 FROM sociedad.poblacion",
        "edad": "SELECT cvegeo, anio, rango, hombres, mujeres FROM sociedad.edad",
        "etnicidad": "SELECT cvegeo, anio, grupo, total, hombres, mujeres FROM sociedad.etnicidad",
        "idh": "SELECT cvegeo, anio, region, idh, nivel FROM sociedad.idh",
        "vivienda": """
            SELECT cvegeo, anio, viviendas_habitadas, personas_por_vivienda,
                   pct_electricidad, pct_sin_electricidad, pct_agua, pct_sin_agua,
                   pct_drenaje, pct_sin_drenaje, pct_internet, pct_computadora, pct_celular
            FROM sociedad.vivienda
        """,
        "educacion": """
            SELECT cvegeo, anio, grado_promedio_anios, tasa_alfabetizacion,
                   pct_basica, pct_media_superior, pct_superior
            FROM sociedad.educacion
        """,
        "migracion": """
            SELECT cvegeo, anio, pct_viv_remesas, pct_viv_emigrantes_eu, pct_viv_circulares,
                   pct_viv_retorno, indice_iim, grado_iim, lugar_nacional,
                   remesas_usd_millones, anio_remesas
            FROM sociedad.migracion
        """,
        "marginacion": "SELECT cvegeo, anio, indice, grado, lugar_estatal, lugar_nacional FROM sociedad.marginacion",
        "carencia": "SELECT cvegeo, anio, carencia, poblacion_con_carencia, pct_poblacion FROM sociedad.carencia",
        "empleo": "SELECT cvegeo, anio, pct_pea, pct_ocupada, pct_ocupada_informal FROM economia.empleo",
        "desigualdad": "SELECT cvegeo, anio, gini, razon_ingreso FROM economia.desigualdad",
        "pbt": "SELECT cvegeo, anio, sector, pbt_mdp, pct_sector FROM economia.pbt",
        "agricola": """
            SELECT cvegeo, anio, upa_activas, upa_cielo_abierto, superficie_sembrada_ha,
                   superficie_cosechada_ha, produccion_ton
            FROM economia.agricola
        """,
        "ganadera": "SELECT cvegeo, anio, especie, viviendas, cabezas FROM economia.ganadera",
        "ue_tamano": "SELECT cvegeo, anio, tamano, total, pct FROM economia.ue_tamano",
        "ue_actividad": "SELECT cvegeo, anio, actividad, total, pct FROM economia.ue_actividad",
        "finanzas": """
            SELECT cvegeo, anio_autonomia, autonomia_pct, anio_dependencia,
                   dependencia_aportaciones_pct, anio_presupuesto, presupuesto_ejercido
            FROM gobierno.finanzas
        """,
        "tramite": "SELECT cvegeo, anio, tipo, cantidad FROM gobierno.tramite",
        "servicio": "SELECT cvegeo, anio, alumbrado_pct, agua_pct, drenaje_pct FROM gobierno.servicio",
        "delito": "SELECT cvegeo, anio, categoria, cantidad FROM gobierno.delito",
        "seguridad": """
            SELECT cvegeo, anio, presupuesto_administracion, presupuesto_seguridad, pct_seguridad
            FROM gobierno.seguridad
        """,
        "presentacion": """
            SELECT cvegeo, toponimia, contexto_historico, localizacion, temperatura_precipitacion
            FROM general.presentacion
        """,
    }
    with conectar() as conn:
        municipios = geojson(conn, capas)
        locs = geojson(conn, localidades)
        por_tabla = {nombre: agrupar(consulta(conn, sql)) for nombre, sql in tablas.items()}
        catalogo = consulta(
            conn,
            """
            SELECT tema, tabla, variable, descripcion, anio, unidad, fuente
            FROM catalogo.variable
            ORDER BY orden
            """,
        )
    cves = [f["properties"]["cvegeo"] for f in municipios["features"]]
    fichas = {}
    for cve in cves:
        fichas[cve] = {nombre: por_tabla[nombre].get(cve, []) for nombre in tablas}
    return {
        "municipios": municipios,
        "localidades": locs,
        "fichas": fichas,
        "catalogo": catalogo,
    }


TIPOS = {
    ".html": "text/html; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".js": "text/javascript; charset=utf-8",
    ".svg": "image/svg+xml",
    ".png": "image/png",
}


class Visor(BaseHTTPRequestHandler):
    def log_message(self, formato, *args):
        print("%s %s" % (self.address_string(), formato % args))

    def ruta(self):
        path = urlparse(self.path).path
        if path == PREFIJO:
            return "/"
        if path.startswith(PREFIJO + "/"):
            return path[len(PREFIJO):] or "/"
        return path

    def enviar(self, codigo, cuerpo, tipo):
        if isinstance(cuerpo, str):
            cuerpo = cuerpo.encode("utf-8")
        self.send_response(codigo)
        self.send_header("Content-Type", tipo)
        self.send_header("Content-Length", str(len(cuerpo)))
        self.send_header("Cache-Control", "no-cache")
        self.send_header("X-Content-Type-Options", "nosniff")
        self.end_headers()
        self.wfile.write(cuerpo)

    def fallo(self, exc):
        if isinstance(exc, CupoLleno):
            self.enviar(503, json.dumps({"error": "servicio ocupado"}), "application/json; charset=utf-8")
            return
        print("%s %s" % (self.address_string(), type(exc).__name__), flush=True)
        self.enviar(500, json.dumps({"error": "consulta no disponible"}), "application/json; charset=utf-8")

    def enviar_pdf(self, ruta):
        datos = ruta.read_bytes()
        nombre = ruta.name
        self.send_response(200)
        self.send_header("Content-Type", "application/pdf")
        self.send_header("Content-Length", str(len(datos)))
        self.send_header(
            "Content-Disposition",
            "attachment; filename=\"cuadernillo.pdf\"; filename*=UTF-8''%s" % quote(nombre),
        )
        self.send_header("Cache-Control", "no-cache")
        self.send_header("X-Content-Type-Options", "nosniff")
        self.end_headers()
        self.wfile.write(datos)

    def do_GET(self):
        consulta_url = parse_qs(urlparse(self.path).query)
        path = self.ruta()
        if path == "/api/municipio":
            try:
                x = float(consulta_url.get("x", [""])[0])
                y = float(consulta_url.get("y", [""])[0])
            except ValueError:
                self.enviar(400, json.dumps({"error": "coordenadas"}), "application/json; charset=utf-8")
                return
            try:
                fila = municipio_en(x, y)
            except Exception as exc:
                self.fallo(exc)
                return
            cuerpo = {
                "cvegeo": fila["cvegeo"],
                "nomgeo": fila["nomgeo"],
                "xmin": fila["xmin"],
                "ymin": fila["ymin"],
                "xmax": fila["xmax"],
                "ymax": fila["ymax"],
            } if fila else {"cvegeo": None}
            self.enviar(200, json.dumps(cuerpo, ensure_ascii=False), "application/json; charset=utf-8")
            return
        if path == "/api/cuadernillo":
            cvegeo = consulta_url.get("cvegeo", [""])[0].strip()
            try:
                ruta = cuadernillo_pdf(cvegeo)
            except Exception as exc:
                self.fallo(exc)
                return
            if ruta is None:
                self.enviar(404, json.dumps({"error": "sin cuadernillo"}), "application/json; charset=utf-8")
                return
            self.enviar_pdf(ruta)
            return
        if path == "/api/geometria":
            try:
                cuerpo = json.dumps(geometria_municipios(), ensure_ascii=False).encode("utf-8")
            except Exception as exc:
                self.fallo(exc)
                return
            self.enviar(200, cuerpo, "application/json; charset=utf-8")
            return
        if path == "/api/datos":
            try:
                cuerpo = json.dumps(datos(), ensure_ascii=False, default=json_default).encode("utf-8")
            except Exception as exc:
                self.fallo(exc)
                return
            self.enviar(200, cuerpo, "application/json; charset=utf-8")
            return
        if path in ("/", "/index.html"):
            destino = ROOT / "index.html"
        else:
            relativo = path.lstrip("/")
            destino = (ROOT / relativo).resolve()
            if ROOT not in destino.parents:
                self.enviar(404, "No encontrado", "text/plain; charset=utf-8")
                return
        if not destino.is_file() or destino.suffix.lower() not in TIPOS:
            self.enviar(404, "No encontrado", "text/plain; charset=utf-8")
            return
        if any(parte.startswith(".") for parte in destino.relative_to(ROOT).parts):
            self.enviar(404, "No encontrado", "text/plain; charset=utf-8")
            return
        self.enviar(200, destino.read_bytes(), TIPOS[destino.suffix.lower()])


def main():
    puerto = int(os.environ.get("IPLANAY_PORT", "8080"))
    servidor = ThreadingHTTPServer(("0.0.0.0", puerto), Visor)
    print(f"Cuadernillos IPLANAY en el puerto {puerto}")
    servidor.serve_forever()


if __name__ == "__main__":
    main()
