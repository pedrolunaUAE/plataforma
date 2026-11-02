# Lee toponimia, contexto historico, localizacion y temperatura de los
# cuadernillos y los guarda en general.presentacion.

import os
import re
import subprocess

import pymupdf

PDF_DIR = r"D:\ws\plataforma\proyectos\iplanay\PDFs"
SALTAR = re.compile(r"^(Cuadernillo Geoestad|20\d\d|\d{1,3})$")
SECCIONES = ["Toponimia", "Contexto histórico", "Localización", "Temperatura"]
COLUMNAS = {
    "Toponimia": "toponimia",
    "Contexto histórico": "contexto_historico",
    "Localización": "localizacion",
    "Temperatura": "temperatura_precipitacion",
}


def titulo(linea):
    if "..." in linea or "…" in linea:
        return None
    for nombre in ["Toponimia", "Contexto histórico", "Localización", "Localidades"]:
        if linea == nombre:
            return nombre
    if linea.startswith("Temperatura") and len(linea) < 45:
        return "Temperatura"
    return None


def extraer(path):
    doc = pymupdf.open(path)
    flujo = []
    for pagina in doc:
        for linea in pagina.get_text().splitlines():
            linea = linea.strip()
            if linea:
                flujo.append(linea)
    marcas = [(i, titulo(linea)) for i, linea in enumerate(flujo) if titulo(linea)]
    ultimo = {}
    for i, nombre in marcas:
        ultimo[nombre] = i
    textos = {}
    for nombre in SECCIONES:
        if nombre not in ultimo:
            textos[nombre] = None
            continue
        inicio = ultimo[nombre]
        siguientes = [i for i, _nombre in marcas if i > inicio]
        fin = min(siguientes) if siguientes else len(flujo)
        trozos = []
        for linea in flujo[inicio + 1:fin]:
            if linea.startswith("Ilustración") or linea.startswith("Fuente:") or linea.startswith("Mapa "):
                break
            if SALTAR.match(linea) or linea.startswith("Municipio de"):
                continue
            trozos.append(linea)
        texto = " ".join(trozos).strip()
        textos[nombre] = texto or None
    return textos


def sql_texto(valor):
    if valor is None:
        return "NULL"
    return "$txt$" + valor.replace("$txt$", " ") + "$txt$"


def main():
    filas = []
    for nombre in sorted(os.listdir(PDF_DIR)):
        if not nombre.endswith(".pdf"):
            continue
        clave = "18" + nombre[:3]
        textos = extraer(os.path.join(PDF_DIR, nombre))
        if any(not textos[s] for s in SECCIONES):
            raise SystemExit("Falta texto en " + nombre)
        filas.append((clave, textos))
    if len(filas) != 20:
        raise SystemExit("Se esperaban 20 cuadernillos")
    valores = []
    for clave, textos in filas:
        columnas = ", ".join(sql_texto(textos[s]) for s in SECCIONES)
        valores.append("('%s', %s)" % (clave, columnas))
    sentencia = """
INSERT INTO general.presentacion (
    cvegeo, toponimia, contexto_historico, localizacion, temperatura_precipitacion
) VALUES
%s
ON CONFLICT (cvegeo) DO UPDATE SET
    toponimia = EXCLUDED.toponimia,
    contexto_historico = EXCLUDED.contexto_historico,
    localizacion = EXCLUDED.localizacion,
    temperatura_precipitacion = EXCLUDED.temperatura_precipitacion;
""" % ",\n".join(valores)
    catalogo = """
DELETE FROM catalogo.variable WHERE tabla = 'general.presentacion';
INSERT INTO catalogo.variable (orden, tema, tabla, variable, descripcion, anio, unidad, fuente) VALUES
(82, 'General', 'general.presentacion', 'toponimia', 'Toponimia del municipio', '2026', 'Texto', 'Cuadernillo geoestadístico municipal. IPLANAY, 2026.'),
(83, 'General', 'general.presentacion', 'contexto_historico', 'Contexto histórico del municipio', '2026', 'Texto', 'Cuadernillo geoestadístico municipal. IPLANAY, 2026.'),
(84, 'General', 'general.presentacion', 'localizacion', 'Localización del municipio', '2026', 'Texto', 'Cuadernillo geoestadístico municipal. IPLANAY, 2026.'),
(85, 'General', 'general.presentacion', 'temperatura_precipitacion', 'Temperatura y precipitación', '2026', 'Texto', 'Cuadernillo geoestadístico municipal. IPLANAY, 2026.');
"""
    sql = "BEGIN;\n" + sentencia + catalogo + "COMMIT;\n"
    subprocess.run(
        ["docker", "exec", "-i", "plataforma-postgres", "psql", "-U", "postgres", "-d", "iplanay", "-v", "ON_ERROR_STOP=1"],
        input=sql.encode("utf-8"),
        check=True,
    )
    print("presentacion: %s municipios" % len(filas))


if __name__ == "__main__":
    main()
