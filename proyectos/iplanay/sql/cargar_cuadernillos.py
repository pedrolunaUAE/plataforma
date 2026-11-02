# Lee los cuadernillos geoestadisticos municipales y llena las tablas
# sociedad, economia y gobierno de la base iplanay.
# La clave es cvegeo, la misma de mg.municipio.

import os
import re
import subprocess
import sys
from collections import defaultdict

PDF_DIR = r"D:\ws\plataforma\proyectos\iplanay\PDFs"
CONTAINER = "plataforma-postgres"

REGIONES = ("Costa Norte", "Costa Sur", "Norte", "Sur", "Centro", "Sierra")
NIVELES = ("Muy alto", "Alto", "Medio", "Bajo", "Muy bajo")
RANGOS = [
    "0_4", "5_9", "10_14", "15_19", "20_24", "25_29", "30_34", "35_39",
    "40_44", "45_49", "50_54", "55_59", "60_64", "65_69", "70_74", "75_79",
    "80_84", "85 y más", "85 y mas",
]


def num(token):
    token = token.strip().replace("%", "").replace(",", "")
    if token == "":
        return None
    return float(token) if "." in token else int(token)


def merge_miles(texto):
    def unir(m):
        return m.group(0).replace(" ", "")

    return re.sub(r"\b\d{1,3}(?: \d{3})+\b", unir, texto)


def lineas_pdf(path):
    import pymupdf

    doc = pymupdf.open(path)
    bruto = []
    for pi, page in enumerate(doc):
        grupos = defaultdict(list)
        for w in page.get_text("words"):
            y = round(w[1] / 3) * 3
            grupos[y].append(w)
        for y in sorted(grupos):
            palabras = sorted(grupos[y], key=lambda w: w[0])
            bruto.append({
                "page": pi + 1,
                "y": y,
                "words": [(w[0], w[4]) for w in palabras],
                "text": " ".join(w[4] for w in palabras),
            })
    return bruto


def es_ruido(linea):
    if isinstance(linea, dict):
        t = linea["text"].strip()
        y = linea["y"]
    else:
        t = str(linea).strip()
        y = None
    if not t:
        return True
    if t.startswith("Cuadernillo Geoestadístico") or t.startswith("Cuadernillo Geoestadistico"):
        return True
    # El folio va al pie de la hoja. Un conteo de tres digitos en el cuerpo es un dato.
    if re.fullmatch(r"\d{1,3}", t) and (y is None or y > 700):
        return True
    return False


def seccion(lineas, inicio, fin_regex):
    i0 = None
    for i, linea in enumerate(lineas):
        if inicio(linea["text"]):
            # El indice repite el titulo al principio del PDF. Quedarse con la ultima
            # ocurrencia que tenga filas de datos despues, se resuelve afuera.
            i0 = i
    if i0 is None:
        return []
    out = []
    for linea in lineas[i0 + 1:]:
        if re.search(fin_regex, linea["text"], re.I):
            break
        if not es_ruido(linea):
            out.append(linea)
    return out


def todas(lineas, inicio, fin_regex):
    """Todas las ocurrencias del titulo, no solo la del indice."""
    bloques = []
    i = 0
    while i < len(lineas):
        if inicio(lineas[i]["text"]) and lineas[i]["page"] > 4:
            out = []
            j = i + 1
            while j < len(lineas):
                if re.search(fin_regex, lineas[j]["text"], re.I):
                    break
                if lineas[j]["page"] > lineas[i]["page"] + 2:
                    break
                if not es_ruido(lineas[j]):
                    out.append(lineas[j])
                j += 1
            if out:
                bloques.append(out)
            i = j
        else:
            i += 1
    return bloques


def texto_bloque(bloque):
    return merge_miles(" ".join(linea["text"] for linea in bloque))


def fila_valor(bloque, umbral=340):
    """Etiqueta a la izquierda y valor a la derecha. Une renglones partidos."""
    filas = []
    etiqueta = []
    valor = []
    for linea in bloque:
        izq = [t for x, t in linea["words"] if x < umbral]
        der = [t for x, t in linea["words"] if x >= umbral]
        if der and valor:
            filas.append((" ".join(etiqueta), " ".join(valor)))
            etiqueta, valor = [], []
        etiqueta.extend(izq)
        valor.extend(der)
    if valor or etiqueta:
        filas.append((" ".join(etiqueta), " ".join(valor)))
    return [(e, v) for e, v in filas if e or v]


def pct(token):
    if token is None or token == "":
        return None
    return num(str(token).replace("%", ""))


def primer_numero(texto):
    m = re.search(r"\d[\d,]*(?:\.\d+)?", texto or "")
    return num(m.group(0)) if m else None


def parse_poblacion(bloques, cve):
    filas = {}
    for bloque in bloques:
        for linea in bloque:
            t = merge_miles(linea["text"])
            m = re.search(
                r"\b(2020|2025)\b(?:\s+[^0-9]\S*)*\s+(\d+)\s+(\d+)\s+(\d+)(?:\s+([\d.]+))?\s*$",
                t,
            )
            if not m:
                continue
            hombres = int(m.group(2))
            if hombres < 50:
                continue
            anio = int(m.group(1))
            filas[anio] = {
                "anio": anio,
                "hombres": hombres,
                "mujeres": int(m.group(3)),
                "total": int(m.group(4)),
                "densidad": num(m.group(5)) if m.group(5) else None,
            }
    return list(filas.values())


def parse_edad(bloques):
    rx = re.compile(
        r"(0_4|5_9|10_14|15_19|20_24|25_29|30_34|35_39|40_44|45_49|50_54|55_59|60_64|65_69|70_74|75_79|80_84|85 y más)"
    )
    filas = {}
    for bloque in bloques:
        pendiente = None
        for linea in bloque:
            t = linea["text"].replace("85 y mas", "85 y más")
            m = rx.search(t)
            numeros = [int(x) for x in re.findall(r"\b\d+\b", rx.sub(" ", t))]
            if m and len(numeros) >= 2:
                filas[m.group(1)] = {"rango": m.group(1), "hombres": numeros[0], "mujeres": numeros[1]}
                pendiente = None
            elif m:
                pendiente = m.group(1)
            elif pendiente and len(numeros) >= 2:
                filas[pendiente] = {"rango": pendiente, "hombres": numeros[0], "mujeres": numeros[1]}
                pendiente = None
    return list(filas.values())


def anio_edad(filas, poblacion):
    suma = sum(f["hombres"] + f["mujeres"] for f in filas)
    mejor, dist = 2020, None
    for p in poblacion:
        d = abs(suma - p["total"])
        if dist is None or d < dist:
            dist = d
            mejor = p["anio"]
    return mejor


def parse_etnicidad(bloques, prosa):
    texto = prosa or ""
    filas = []
    ind_t = re.search(
        r"total de\s+([\d,]+)\s+personas de 3 años y más que declararon hablar",
        texto, re.I,
    )
    ind_hm = re.search(r"identificaron\s+([\d,]+)\s+hombres y\s+([\d,]+)\s+mujeres", texto, re.I)
    afro_t = re.search(r"fueron\s+([\d,]+)\s+personas de 3", texto, re.I)
    afro_hm = re.search(r"([\d,]+)\s+eran hombres y\s+([\d,]+)\s+mujeres", texto, re.I)
    if ind_t and ind_hm:
        filas.append({
            "grupo": "Hablantes de lengua indígena",
            "total": int(ind_t.group(1).replace(",", "")),
            "hombres": int(ind_hm.group(1).replace(",", "")),
            "mujeres": int(ind_hm.group(2).replace(",", "")),
        })
    if afro_t and afro_hm:
        filas.append({
            "grupo": "Afrodescendientes",
            "total": int(afro_t.group(1).replace(",", "")),
            "hombres": int(afro_hm.group(1).replace(",", "")),
            "mujeres": int(afro_hm.group(2).replace(",", "")),
        })
    if len(filas) == 2:
        return filas
    # Respaldo: cifras de la tabla, aunque el nombre quede en el renglon de arriba o de abajo.
    for bloque in bloques:
        pendiente = []
        etiqueta = []
        for linea in bloque:
            tokens = [t for _, t in linea["words"]]
            numeros = [t for t in tokens if re.fullmatch(r"\d+", t)]
            palabras = [t for t in tokens if t not in numeros and t not in ("Total", "Hombres", "Mujeres", "Grupo", "poblacional")]
            if numeros and not palabras:
                pendiente = numeros
                continue
            if palabras:
                etiqueta.extend(palabras)
                if pendiente or numeros:
                    nums = pendiente or numeros
                    blob = " ".join(etiqueta).lower()
                    if len(nums) >= 3 and ("indígena" in blob or "indigena" in blob or "hablante" in blob):
                        filas.append({
                            "grupo": "Hablantes de lengua indígena",
                            "total": int(nums[0]), "hombres": int(nums[1]), "mujeres": int(nums[2]),
                        })
                    elif len(nums) >= 3 and "afro" in blob:
                        filas.append({
                            "grupo": "Afrodescendientes",
                            "total": int(nums[0]), "hombres": int(nums[1]), "mujeres": int(nums[2]),
                        })
                    etiqueta = []
                    pendiente = []
    vistos = {}
    for fila in filas:
        vistos[fila["grupo"]] = fila
    return list(vistos.values())


def parse_idh(bloques):
    filas = []
    rx = re.compile(
        r"^(18\d{3})\s+(?:(.+?)\s+)?(Costa Norte|Costa Sur|Norte|Sur|Centro|Sierra)\s+([\d.]+)\s+(Muy alto|Muy bajo|Alto|Medio|Bajo)$"
    )
    for bloque in bloques:
        for linea in bloque:
            m = rx.match(linea["text"])
            if m:
                filas.append({
                    "cvegeo": m.group(1),
                    "region": m.group(3),
                    "idh": num(m.group(4)),
                    "nivel": m.group(5),
                })
    return filas


def parse_vivienda_tabla(bloques):
    out = {}
    for bloque in bloques:
        for linea in bloque:
            t = linea["text"]
            m = re.search(
                r"(energ[ií]a el[eé]ctrica|agua potable|drenaje)\s+([\d.]+)\s*%?\s+([\d.]+)\s*%?",
                t,
                re.I,
            )
            if not m:
                continue
            clave = m.group(1).lower()
            if "energ" in clave:
                out["pct_electricidad"] = pct(m.group(2))
                out["pct_sin_electricidad"] = pct(m.group(3))
            elif "agua" in clave:
                out["pct_agua"] = pct(m.group(2))
                out["pct_sin_agua"] = pct(m.group(3))
            else:
                out["pct_drenaje"] = pct(m.group(2))
                out["pct_sin_drenaje"] = pct(m.group(3))
    return out


def parse_label_pct(bloques, reglas):
    """reglas: lista de (regex sobre etiqueta, clave)."""
    out = {}
    for bloque in bloques:
        for etiqueta, valor in fila_valor(bloque):
            for rx, clave in reglas:
                if clave in out or not re.search(rx, etiqueta, re.I):
                    continue
                m = re.search(r"[\d.]+", valor.replace("%", ""))
                if m:
                    out[clave] = num(m.group(0))
                    break
    return out


def parse_migracion(bloques):
    datos = parse_label_pct(bloques, [
        (r"reciben remesas", "pct_viv_remesas"),
        (r"emigrantes", "pct_viv_emigrantes_eu"),
        (r"circulares", "pct_viv_circulares"),
        (r"retorno", "pct_viv_retorno"),
        (r"ndice de intensidad", "indice_iim"),
        (r"posici[oó]n|escala nacional", "lugar_nacional"),
    ])
    for bloque in bloques:
        for etiqueta, valor in fila_valor(bloque):
            if re.search(r"grado de intensidad", etiqueta, re.I):
                grado = valor.strip() or None
                if grado:
                    datos["grado_iim"] = grado.split()[0] if False else valor.strip()
    return datos


def parse_marginacion(bloques):
    datos = {}
    for bloque in bloques:
        for etiqueta, valor in fila_valor(bloque):
            e = etiqueta.lower()
            if "grado" in e and "margin" in e:
                datos["grado"] = valor.strip()
            elif "ndice" in e and "margin" in e:
                datos["indice"] = primer_numero(valor)
            elif "estatal" in e:
                datos["lugar_estatal"] = primer_numero(valor)
            elif "nacional" in e:
                datos["lugar_nacional"] = primer_numero(valor)
    return datos


CARENCIAS = [
    (r"rezago educativo", "Rezago educativo"),
    (r"servicios de salud", "Acceso a los servicios de salud"),
    (r"seguridad social", "Acceso a seguridad social"),
    (r"calidad y espacios", "Calidad y espacios de la vivienda"),
    (r"servicios b[aá]sicos", "Acceso a los servicios básicos de la vivienda"),
    (r"alimentaci[oó]n", "Acceso a la alimentación nutritiva"),
]


def etiqueta_carencia(texto):
    limpia = re.sub(r"\d+(?:[.,]\d+)?\s*%?", " ", texto)
    return re.sub(r"\s+", " ", limpia).strip()


def parse_carencias(bloques):
    filas = []
    vistos = set()
    for bloque in bloques:
        lineas = [linea["text"] for linea in bloque]
        for i, texto in enumerate(lineas):
            if not re.search(r"\d", texto):
                continue
            partes = []
            if i > 0 and not re.search(r"\d", lineas[i - 1]):
                partes.append(lineas[i - 1])
            partes.append(texto)
            etiqueta = etiqueta_carencia(" ".join(partes))
            if not any(re.search(rx, etiqueta, re.I) for rx, _ in CARENCIAS):
                if i + 1 < len(lineas) and not re.search(r"\d", lineas[i + 1]):
                    partes.append(lineas[i + 1])
                    etiqueta = etiqueta_carencia(" ".join(partes))
            nombre = None
            for rx, candidato in CARENCIAS:
                if candidato not in vistos and re.search(rx, etiqueta, re.I):
                    nombre = candidato
                    break
            if not nombre:
                continue
            sin_pct = re.sub(r"\d+(?:\.\d+)?\s*%", " ", texto)
            sin_pct = re.sub(r"\d+\.\d+", " ", sin_pct)
            enteros = [int(n) for n in re.findall(r"\b(\d+)\b", sin_pct.replace(",", ""))]
            porcents = re.findall(r"(\d+(?:\.\d+)?)\s*%", texto)
            if not porcents:
                suelto = re.search(r"(\d+\.\d+)\s*$", texto.strip())
                if suelto:
                    porcents = [suelto.group(1)]
            if enteros and porcents:
                filas.append({
                    "carencia": nombre,
                    "poblacion": max(enteros),
                    "pct": num(porcents[-1]),
                })
                vistos.add(nombre)
    return filas


def parse_empleo(bloques):
    return parse_label_pct(bloques, [
        (r"econ[oó]micamente activa|\(PEA\)", "pct_pea"),
        (r"ocupada informal", "pct_ocupada_informal"),
        (r"poblaci[oó]n ocupada(?! informal)", "pct_ocupada"),
    ])


def parse_pbt(bloques):
    filas = []
    for bloque in bloques:
        for linea in bloque:
            t = merge_miles(linea["text"])
            m = re.match(
                r"^(Primario|Secundario|Terciario|Total municipal)\s+([\d.]+)(?:\s+([\d.]+)\s*%?)?$",
                t,
            )
            if m:
                filas.append({
                    "sector": m.group(1),
                    "pbt": num(m.group(2)),
                    "pct": num(m.group(3)) if m.group(3) else None,
                })
    unicos = {}
    for fila in filas:
        unicos.setdefault(fila["sector"], fila)
    return list(unicos.values())


def parse_agricola(bloques):
    return parse_label_pct(bloques, [
        (r"agropecuaria activas", "upa_activas"),
        (r"cielo abierto", "upa_cielo_abierto"),
        (r"sembrada", "superficie_sembrada_ha"),
        (r"cosechada", "superficie_cosechada_ha"),
        (r"producci[oó]n agr[ií]cola total", "produccion_ton"),
    ])


def numeros_por_columna(words):
    """Junta millares que estan pegados y separa viviendas de cabezas por su posicion."""
    brutos = []
    for x, t in words:
        limpio = t.replace(",", "")
        if re.fullmatch(r"\d+", limpio):
            brutos.append((x, limpio))
    if not brutos:
        return []
    grupos = []
    for x, t in brutos:
        if grupos and x - grupos[-1][0] < 28:
            grupos[-1] = (x, grupos[-1][1] + t)
        else:
            grupos.append((x, t))
    return [(x, int(t)) for x, t in grupos]


def parse_ganadera(bloques):
    filas = {}
    for bloque in bloques:
        pendiente = None
        espera = None
        for linea in bloque:
            label = " ".join(t for x, t in linea["words"] if x < 260 and not re.fullmatch(r"\d+", t))
            valores = numeros_por_columna(linea["words"])
            especie = None
            m = re.search(r"bovinos|porcinos|ovinos", label, re.I)
            if m:
                especie = m.group(0).capitalize()
            if especie and len(valores) >= 2:
                filas[especie] = {"especie": especie, "viviendas": valores[0][1], "cabezas": valores[-1][1]}
                pendiente = None
                espera = None
            elif especie and pendiente:
                filas[especie] = {"especie": especie, "viviendas": pendiente[0][1], "cabezas": pendiente[-1][1]}
                pendiente = None
                espera = None
            elif especie:
                espera = especie
            elif espera and len(valores) >= 2:
                filas[espera] = {"especie": espera, "viviendas": valores[0][1], "cabezas": valores[-1][1]}
                espera = None
            elif len(valores) >= 2:
                pendiente = valores
    return list(filas.values())


def parse_ue_tamano(bloques):
    filas = []
    for bloque in bloques:
        for linea in bloque:
            t = linea["text"]
            m = re.match(r"^(Micro|Pequeña|Pequena|Mediana|Grande)\s+(\d+)\s+([\d.]+)\s*%?$", t)
            if m:
                nombre = {"Pequena": "Pequeña"}.get(m.group(1), m.group(1))
                filas.append({"tamano": nombre, "total": int(m.group(2)), "pct": num(m.group(3))})
    return filas


def parse_ue_actividad(bloques):
    filas = []
    for bloque in bloques:
        for linea in bloque:
            t = linea["text"]
            m = re.match(
                r"^(Agricultura|Comercio|Construcción|Construccion|Energía|Energia|Manufactura|Minería|Mineria|Servicios)\s+(\d+)\s+([\d.]+)\s*%?$",
                t,
            )
            if m:
                nombre = {
                    "Construccion": "Construcción",
                    "Energia": "Energía",
                    "Mineria": "Minería",
                }.get(m.group(1), m.group(1))
                filas.append({"actividad": nombre, "total": int(m.group(2)), "pct": num(m.group(3))})
    return filas


def parse_dependencia(bloques, cve):
    for bloque in bloques:
        for linea in bloque:
            m = re.match(r"^(18\d{3})\s+.+\s+(20\d{2})\s+([\d.]+)\s*%?$", linea["text"])
            if m and m.group(1) == cve:
                return int(m.group(2)), num(m.group(3))
    return None, None


def parse_servicios(bloques, cve):
    for bloque in bloques:
        for linea in bloque:
            t = linea["text"]
            if cve not in t:
                continue
            porc = re.findall(r"([\d.]+)\s*%", t)
            if len(porc) >= 3:
                return {
                    "alumbrado_pct": num(porc[0]),
                    "agua_pct": num(porc[1]),
                    "drenaje_pct": num(porc[2]),
                }
    return {}


def servicios_desde_prosa(texto):
    def uno(patron):
        m = re.search(patron, texto, re.I)
        return num(m.group(1)) if m else None

    datos = {
        "alumbrado_pct": uno(r"alumbrado p[uú]blico de\s+([\d.]+)\s*%"),
        "agua_pct": uno(r"agua potable fue de\s+([\d.]+)\s*%"),
        "drenaje_pct": uno(r"drenaje y\s+alcantarillado alcanza un porcentaje de\s+([\d.]+)\s*%"),
    }
    if any(v is not None for v in datos.values()):
        return datos
    return {}


def parse_delitos(bloques):
    reglas = [
        (r"vida,?\s+integridad|libertad\s+personal", "Delitos contra la vida, integridad y libertad personal"),
        (r"sexuales|violencia de g[eé]nero", "Delitos sexuales y violencia de género"),
        (r"patrimonio", "Delitos contra el patrimonio"),
        (r"sociedad y el orden|orden p[uú]blico", "Delitos contra la sociedad y el orden público"),
        (r"otros delitos|faltas administrativas", "Otros delitos y faltas administrativas"),
    ]
    filas = []
    vistos = set()
    for bloque in bloques:
        lineas = [linea["text"] for linea in bloque]
        for i, texto in enumerate(lineas):
            blob = texto
            if i > 0 and not re.search(r"\d", lineas[i - 1]):
                blob = lineas[i - 1] + " " + blob
            if not re.search(r"\d", texto) and i + 1 < len(lineas):
                blob = blob + " " + lineas[i + 1]
            if not re.search(r"\d", blob):
                continue
            for rx, nombre in reglas:
                if nombre in vistos or not re.search(rx, blob, re.I):
                    continue
                m = re.search(r"(?:" + rx + r")\D{0,40}(\d+)", blob, re.I)
                if not m:
                    m = re.search(r"(\d+)\D{0,40}(?:" + rx + r")", blob, re.I)
                if m:
                    filas.append({"categoria": nombre, "cantidad": int(m.group(1))})
                    vistos.add(nombre)
    return filas


def parse_seguridad(bloques):
    for bloque in bloques:
        for linea in bloque:
            if linea["text"].lower().startswith("presupuesto"):
                continue
            nums = []
            for x, t in linea["words"]:
                limpio = t.replace(",", "")
                if re.fullmatch(r"\d+", limpio):
                    nums.append((x, limpio))
            if len(nums) < 4:
                continue
            corte = max(range(1, len(nums)), key=lambda i: nums[i][0] - nums[i - 1][0])
            if nums[corte][0] - nums[corte - 1][0] < 30:
                continue
            izquierda = int("".join(t for _, t in nums[:corte]))
            derecha = int("".join(t for _, t in nums[corte:]))
            if izquierda >= 10000 and derecha >= 1000:
                return izquierda, derecha
    return None, None


def bloque_texto(lineas, empieza, termina, page_min=5):
    partes = []
    activo = False
    for linea in lineas:
        if linea["page"] < page_min:
            continue
        if not activo and empieza(linea["text"]):
            activo = True
            partes = [linea["text"]]
            continue
        if activo and termina(linea["text"]):
            break
        if activo and not es_ruido(linea):
            partes.append(linea["text"])
    return merge_miles(" ".join(partes))


def buscar(texto, patron):
    m = re.search(patron, texto, re.I)
    return m


def parse_prosa(lineas):
    vivienda = bloque_texto(
        lineas,
        lambda t: t.strip() in ("Viviendas", "Vivienda") or t.strip().endswith(" Viviendas"),
        lambda t: "Educación" in t or "Educacion" in t,
    )
    educacion = bloque_texto(
        lineas,
        lambda t: t.strip() in ("Educación", "Educacion"),
        lambda t: t.strip() == "Migración" or t.strip() == "Migracion",
    )
    migracion = bloque_texto(
        lineas,
        lambda t: t.strip() in ("Migración", "Migracion"),
        lambda t: "Marginación" in t or "Marginacion" in t,
    )
    gini = bloque_texto(
        lineas,
        lambda t: "Coeficiente de Gini" in t,
        lambda t: "Producción Bruta" in t or "Produccion Bruta" in t or "Sectores productivos" in t and "Gini" not in t,
    )
    finanzas = bloque_texto(
        lineas,
        lambda t: t.strip() == "Finanzas" or "Autonomía financiera" in t or "Autonomia financiera" in t,
        lambda t: "Trámites" in t or "Tramites" in t,
    )
    tramites = bloque_texto(
        lineas,
        lambda t: "Trámites y servicios" in t or "Tramites y servicios" in t,
        lambda t: "Servicios Públicos" in t or "Servicios Publicos" in t or t.strip() == "Seguridad pública",
    )
    seguridad = bloque_texto(
        lineas,
        lambda t: "seguridad pública" in t.lower() and "Presupuesto" in t or "función de seguridad" in t.lower(),
        lambda t: t.strip().startswith("Referencias") or "Ilustración 15" in t,
    )
    return {
        "vivienda": vivienda,
        "educacion": educacion,
        "migracion": migracion,
        "gini": gini,
        "finanzas": finanzas,
        "tramites": tramites,
        "seguridad": seguridad,
        "todo": merge_miles(" ".join(l["text"] for l in lineas if l["page"] > 4)),
    }


def parse_pdf(path, cve):
    lineas = lineas_pdf(path)
    prosa = parse_prosa(lineas)
    avisos = []

    poblacion = parse_poblacion(
        todas(lineas, lambda t: "Población total según sexo" in t or "Poblacion total segun sexo" in t, r"Fuente:"),
        cve,
    )
    edad = parse_edad(
        todas(lineas, lambda t: "rangos de edad" in t.lower(), r"Fuente:"),
    )
    etnicidad = parse_etnicidad(
        todas(lineas, lambda t: "lengua indígena" in t.lower() or "lengua indigena" in t.lower(), r"Fuente:"),
        bloque_texto(
            lineas,
            lambda t: t.strip() == "Etnicidad",
            lambda t: "Viviendas" in t or "Desarrollo Humano" in t,
        ),
    )
    idh = parse_idh(
        todas(lineas, lambda t: "Desarrollo Humano" in t and "municipios" in t.lower(), r"Fuente:"),
    )
    vivienda_t = parse_vivienda_tabla(
        todas(lineas, lambda t: "servicios en viviendas" in t.lower(), r"Fuente:"),
    )
    educ_t = parse_label_pct(
        todas(lineas, lambda t: "Estructura educativa" in t, r"Fuente:"),
        [
            (r"b[aá]sica", "pct_basica"),
            (r"media superior", "pct_media_superior"),
            (r"(?<!media )superior", "pct_superior"),
        ],
    )
    migracion = parse_migracion(
        todas(lineas, lambda t: "indicadores de migraci" in t.lower(), r"Fuente:"),
    )
    marginacion = parse_marginacion(
        todas(lineas, lambda t: "indicadores de marginaci" in t.lower(), r"Fuente:"),
    )
    carencias = parse_carencias(
        todas(lineas, lambda t: "carencias sociales" in t.lower(), r"Fuente:"),
    )
    empleo = parse_empleo(
        todas(lineas, lambda t: "Indicadores de empleo" in t, r"Fuente:"),
    )
    pbt = parse_pbt(
        todas(lineas, lambda t: "bruta total" in t.lower() and "sector" in t.lower(), r"Fuente:"),
    )
    agricola = parse_agricola(
        todas(lineas, lambda t: "indicadores de producci" in t.lower() and ("agr" in t.lower()), r"Fuente:"),
    )
    ganadera = parse_ganadera(
        todas(lineas, lambda t: "producción ganadera" in t.lower() or "produccion ganadera" in t.lower(), r"Fuente:"),
    )
    ue_tam = parse_ue_tamano(
        todas(lineas, lambda t: "tamaño de empresa" in t.lower() or "tamano de empresa" in t.lower(), r"Fuente:"),
    )
    ue_act = parse_ue_actividad(
        todas(lineas, lambda t: "actividad económica" in t.lower() and "Unidades" in t, r"Fuente:"),
    )
    anio_dep, dependencia = parse_dependencia(
        todas(lineas, lambda t: "Dependencia de aportaciones" in t, r"Fuente:"),
        cve,
    )
    servicios = parse_servicios(
        todas(lineas, lambda t: "Cobertura de los servicios públicos" in t or "Cobertura de los servicios publicos" in t, r"Fuente:"),
        cve,
    )
    if len(servicios) < 3:
        servicios = servicios_desde_prosa(bloque_texto(
            lineas,
            lambda t: t.strip() in ("Servicios Públicos", "Servicios Publicos"),
            lambda t: "Seguridad" in t,
        )) or servicios
    delitos = parse_delitos(
        todas(lineas, lambda t: "delitos por categor" in t.lower(), r"Fuente:"),
    )
    pres_admin, pres_seg = parse_seguridad(
        todas(lineas, lambda t: "Presupuesto total ejercido" in t or "Presupuesto ejercido por la Administración" in t, r"Fuente:"),
    )

    # Prosa complementaria
    vtxt = prosa["vivienda"]
    m = buscar(vtxt, r"([\d][\d,]*)\s+viviendas particulares habitadas")
    if m:
        vivienda_t["viviendas_habitadas"] = int(m.group(1).replace(",", ""))
    m = buscar(vtxt, r"promedio(?:\s+aproximado)?\s+de\s+([\d.]+)\s+personas por vivienda")
    if not m:
        m = buscar(vtxt, r"([\d.]+)\s+ocupantes por vivienda")
    if m:
        vivienda_t["personas_por_vivienda"] = num(m.group(1))
    m = buscar(vtxt, r"([\d.]+)\s*%[^%]{0,40}acceso a internet|acceso a internet alcanz[oó]\s+([\d.]+)\s*%|([\d.]+)\s*% de las viviendas contaba con internet")
    if m:
        vivienda_t["pct_internet"] = num(next(g for g in m.groups() if g))
    m = buscar(vtxt, r"([\d.]+)\s*%\s*(?:a una computadora|de las viviendas contaba con computadora)")
    if m:
        vivienda_t["pct_computadora"] = num(m.group(1))
    m = buscar(vtxt, r"([\d.]+)\s*%[^%]{0,50}tel[eé]fono celular")
    if m:
        vivienda_t["pct_celular"] = num(m.group(1))

    etxt = prosa["educacion"]
    m = buscar(etxt, r"escolaridad(?:(?!años).){0,120}?([\d.]+)\s*años")
    if m:
        educ_t["grado_promedio_anios"] = num(m.group(1))
    if not re.search(r"15 a 24", etxt):
        m = buscar(etxt, r"alfabetizaci[oó]n alcanza un\s+([\d.]+)\s*%")
        if m:
            educ_t["tasa_alfabetizacion"] = num(m.group(1))

    gtxt = prosa["gini"]
    gini = None
    for patron in (
        r"coeficiente de Gini de\s+([\d.]+)",
        r"coeficiente de\s+(0\.\d+)",
        r"Gini reportado para\s+20\d{2}\s+fue de\s+(0\.\d+)",
        r"alrededor de\s+(0\.\d+)",
        r"fue de\s+(0\.\d+)",
        r"registr[oó] un coeficiente de\s+(0\.\d+)",
    ):
        m = buscar(gtxt, patron)
        if m:
            gini = num(m.group(1))
            break
    razon = None
    m = buscar(gtxt, r"raz[oó]n de ingreso de\s+(0\.\d+)")
    if m:
        razon = num(m.group(1))

    mtxt = prosa["migracion"]
    m = buscar(mtxt, r"([\d.]+)\s+millones de d[oó]lares")
    if m:
        migracion["remesas_usd_millones"] = num(m.group(1))
        migracion["anio_remesas"] = 2024
        ym = buscar(mtxt, r"año\s+(20\d{2})")
        if ym:
            migracion["anio_remesas"] = int(ym.group(1))

    ftxt = prosa["finanzas"] + " " + prosa["todo"]
    m = buscar(prosa["finanzas"], r"autonom[ií]a financiera de\s+([\d.]+)\s*%")
    autonomia = num(m.group(1)) if m else None
    m = buscar(ftxt, r"registr[oó] un presupuesto de\s+([\d][\d ]*)")
    if not m:
        m = buscar(ftxt, r"presupuesto ejercido por la administraci[oó]n p[uú]blica fue de\s+([\d][\d,]*)")
    if not m:
        m = buscar(ftxt, r"presupuesto total ejercido por la administraci[oó]n p[uú]blica por\s+([\d][\d,]*)")
    if not m:
        m = buscar(ftxt, r"presupuesto ejercido de\s+([\d][\d,]*)")
    presupuesto = None
    if m:
        presupuesto = int(m.group(1).replace(" ", "").replace(",", ""))
    if pres_admin:
        presupuesto = pres_admin

    ttxt = prosa["tramites"]
    tramites = []
    patrones_t = [
        (r"([\d][\d,\s]*?)\s+pagos\s+correspondientes\s+al\s+impuesto\s+predial", "Pagos de impuesto predial"),
        (r"([\d][\d,\s]*?)\s+pagos\s+por\s+derechos\s+de\s+suministro", "Pagos por derechos de agua y drenaje"),
        (r"([\d][\d,\s]*?)\s+contrataciones\s+de\s+servicios\s+de\s+agua", "Contrataciones de agua, drenaje y pipas"),
        (r"([\d][\d,\s]*?)\s+tr[aá]mites\s+relacionados\s+a\s+la\s+alineaci[oó]n", "Alineación y número oficial"),
        (r"([\d][\d,\s]*?)\s+licencias\s+de\s+funcionamiento", "Licencias de funcionamiento"),
        (r"([\d][\d,\s]*?)\s+licencias\s+de\s+construcci[oó]n", "Licencias de construcción"),
        (r"([\d][\d,\s]*?)\s+licencias?\s+de\s+uso\s+de\s+suelo", "Licencias de uso de suelo"),
        (r"([\d][\d,\s]*?)\s+solicitudes\s+de\s+copias\s+certificadas", "Copias certificadas de actas"),
        (r"([\d][\d,\s]*?)\s+tr[aá]mites\s+adicionales", "Expedición de documentos oficiales"),
        (r"([\d][\d,\s]*?)\s+asesor[ií]as\s+jur[ií]dicas", "Asesorías jurídicas"),
        (r"([\d][\d,\s]*?)\s+asesor[ií]as\s+psicol[oó]gicas", "Asesorías psicológicas"),
    ]
    for patron, tipo in patrones_t:
        m = buscar(ttxt, patron)
        if m:
            cantidad = int(re.sub(r"[^\d]", "", m.group(1)))
            tramites.append({"tipo": tipo, "cantidad": cantidad})

    m = buscar(prosa["seguridad"] + " " + prosa["todo"], r"porcentaje de\s+([\d.]+)\s*%\s+del presupuesto|([\d.]+)\s*% del presupuesto ejercido")
    pct_seg = None
    if m:
        pct_seg = num(next(g for g in m.groups() if g))
    elif pres_admin and pres_seg:
        pct_seg = round(100.0 * pres_seg / pres_admin, 2)

    if not poblacion:
        avisos.append("sin poblacion")
    if len(edad) < 18:
        avisos.append(f"edad {len(edad)}")
    if len(etnicidad) < 2:
        avisos.append(f"etnicidad {len(etnicidad)}")
    if not any(r["cvegeo"] == cve for r in idh):
        avisos.append("sin idh propio")
    if len(carencias) < 6:
        avisos.append(f"carencias {len(carencias)}")
    if not empleo:
        avisos.append("sin empleo")
    if not pbt:
        avisos.append("sin pbt")
    if not agricola:
        avisos.append("sin agricola")
    if len(ganadera) < 3:
        avisos.append(f"ganadera {len(ganadera)}")
    if len(ue_tam) < 4:
        avisos.append(f"ue_tamano {len(ue_tam)}")
    if len(ue_act) < 7:
        avisos.append(f"ue_actividad {len(ue_act)}")
    if not delitos:
        avisos.append("sin delitos")
    if not servicios:
        avisos.append("sin servicios")
    if gini is None:
        avisos.append("sin gini")
    if not tramites:
        avisos.append("sin tramites")

    return {
        "cvegeo": cve,
        "poblacion": poblacion,
        "edad": edad,
        "anio_edad": anio_edad(edad, poblacion) if edad and poblacion else 2020,
        "etnicidad": etnicidad,
        "idh": idh,
        "vivienda": vivienda_t,
        "educacion": educ_t,
        "migracion": migracion,
        "marginacion": marginacion,
        "carencias": carencias,
        "empleo": empleo,
        "gini": gini,
        "razon": razon,
        "pbt": pbt,
        "agricola": agricola,
        "ganadera": ganadera,
        "ue_tamano": ue_tam,
        "ue_actividad": ue_act,
        "autonomia": autonomia,
        "anio_dependencia": anio_dep or 2021,
        "dependencia": dependencia,
        "presupuesto": presupuesto,
        "tramites": tramites,
        "servicios": servicios,
        "delitos": delitos,
        "pres_admin": pres_admin,
        "pres_seg": pres_seg,
        "pct_seg": pct_seg,
        "avisos": avisos,
    }


def q(valor):
    if valor is None:
        return "NULL"
    if isinstance(valor, str):
        return "'" + valor.replace("'", "''") + "'"
    return str(valor)


def sql_insert(tabla, columnas, filas):
    if not filas:
        return ""
    cols = ", ".join(columnas)
    valores = []
    for fila in filas:
        valores.append("(" + ", ".join(q(fila.get(c)) for c in columnas) + ")")
    return f"INSERT INTO {tabla} ({cols}) VALUES\n" + ",\n".join(valores) + ";\n"


def construir_sql(datos):
    partes = ["BEGIN;\n"]
    tablas = [
        "sociedad.poblacion", "sociedad.edad", "sociedad.etnicidad", "sociedad.idh",
        "sociedad.vivienda", "sociedad.educacion", "sociedad.migracion", "sociedad.marginacion",
        "sociedad.carencia", "economia.empleo", "economia.desigualdad", "economia.pbt",
        "economia.agricola", "economia.ganadera", "economia.ue_tamano", "economia.ue_actividad",
        "gobierno.finanzas", "gobierno.tramite", "gobierno.servicio", "gobierno.delito",
        "gobierno.seguridad",
    ]
    partes.append("TRUNCATE " + ", ".join(tablas) + ";\n")

    pob, edad, etn, idh_rows = [], [], [], []
    viv, edu, mig, mar, car = [], [], [], [], []
    emp, des, pbt, agr, gan, uet, uea = [], [], [], [], [], [], []
    fin, tra, ser, deli, seg = [], [], [], [], []
    idh_vistos = set()

    for d in datos:
        cve = d["cvegeo"]
        for p in d["poblacion"]:
            pob.append({
                "cvegeo": cve, "anio": p["anio"], "hombres": p["hombres"],
                "mujeres": p["mujeres"], "total": p["total"], "densidad_hab_km2": p["densidad"],
            })
        for e in d["edad"]:
            edad.append({
                "cvegeo": cve, "anio": d["anio_edad"], "rango": e["rango"],
                "hombres": e["hombres"], "mujeres": e["mujeres"],
            })
        for e in d["etnicidad"]:
            etn.append({"cvegeo": cve, "anio": 2020, **e})
        for row in d["idh"]:
            if row["cvegeo"] in idh_vistos:
                continue
            if row["cvegeo"] != cve and any(x["cvegeo"] == row["cvegeo"] for x in datos):
                # El cuadro estatal se repite. Solo guardar la fila desde el PDF de ese municipio
                # si ese PDF trae la fila. Aqui se acepta la primera vez que aparece.
                pass
            idh_vistos.add(row["cvegeo"])
            idh_rows.append({
                "cvegeo": row["cvegeo"], "anio": 2020, "region": row["region"],
                "idh": row["idh"], "nivel": row["nivel"],
            })
        if d["vivienda"]:
            viv.append({"cvegeo": cve, "anio": 2020, **d["vivienda"]})
        if d["educacion"]:
            edu.append({"cvegeo": cve, "anio": 2020, **d["educacion"]})
        if d["migracion"]:
            mig.append({
                "cvegeo": cve,
                "anio": 2020,
                "pct_viv_remesas": d["migracion"].get("pct_viv_remesas"),
                "pct_viv_emigrantes_eu": d["migracion"].get("pct_viv_emigrantes_eu"),
                "pct_viv_circulares": d["migracion"].get("pct_viv_circulares"),
                "pct_viv_retorno": d["migracion"].get("pct_viv_retorno"),
                "indice_iim": d["migracion"].get("indice_iim"),
                "grado_iim": d["migracion"].get("grado_iim"),
                "lugar_nacional": d["migracion"].get("lugar_nacional"),
                "remesas_usd_millones": d["migracion"].get("remesas_usd_millones"),
                "anio_remesas": d["migracion"].get("anio_remesas"),
            })
        if d["marginacion"]:
            mar.append({"cvegeo": cve, "anio": 2020, **d["marginacion"]})
        for c in d["carencias"]:
            car.append({
                "cvegeo": cve,
                "anio": 2020,
                "carencia": c["carencia"],
                "poblacion_con_carencia": c["poblacion"],
                "pct_poblacion": c["pct"],
            })
        if d["empleo"]:
            emp.append({"cvegeo": cve, "anio": 2024, **d["empleo"]})
        if d["gini"] is not None or d["razon"] is not None:
            des.append({"cvegeo": cve, "anio": 2020, "gini": d["gini"], "razon_ingreso": d["razon"]})
        for p in d["pbt"]:
            pbt.append({
                "cvegeo": cve, "anio": 2024, "sector": p["sector"],
                "pbt_mdp": p["pbt"], "pct_sector": p["pct"], "unidades_economicas": None,
            })
        if d["agricola"]:
            agr.append({"cvegeo": cve, "anio": 2022, **d["agricola"]})
        for g in d["ganadera"]:
            gan.append({"cvegeo": cve, "anio": 2022, **g})
        for u in d["ue_tamano"]:
            uet.append({"cvegeo": cve, "anio": 2025, **u})
        for u in d["ue_actividad"]:
            uea.append({"cvegeo": cve, "anio": 2025, **u})
        if any(d[k] is not None for k in ("autonomia", "dependencia", "presupuesto")):
            fin.append({
                "cvegeo": cve,
                "anio_autonomia": 2021 if d["autonomia"] is not None else None,
                "autonomia_pct": d["autonomia"],
                "anio_dependencia": d["anio_dependencia"] if d["dependencia"] is not None else None,
                "dependencia_aportaciones_pct": d["dependencia"],
                "anio_presupuesto": 2023 if d["presupuesto"] is not None else None,
                "presupuesto_ejercido": d["presupuesto"],
            })
        for t in d["tramites"]:
            tra.append({"cvegeo": cve, "anio": 2023, **t})
        if d["servicios"]:
            ser.append({"cvegeo": cve, "anio": 2023, **d["servicios"]})
        for x in d["delitos"]:
            deli.append({"cvegeo": cve, "anio": 2024, **x})
        if d["pres_admin"] or d["pres_seg"] or d["pct_seg"] is not None:
            seg.append({
                "cvegeo": cve,
                "anio": 2023,
                "presupuesto_administracion": d["pres_admin"],
                "presupuesto_seguridad": d["pres_seg"],
                "pct_seguridad": d["pct_seg"],
            })

    partes.append(sql_insert("sociedad.poblacion", ["cvegeo", "anio", "hombres", "mujeres", "total", "densidad_hab_km2"], pob))
    partes.append(sql_insert("sociedad.edad", ["cvegeo", "anio", "rango", "hombres", "mujeres"], edad))
    partes.append(sql_insert("sociedad.etnicidad", ["cvegeo", "anio", "grupo", "total", "hombres", "mujeres"], etn))
    partes.append(sql_insert("sociedad.idh", ["cvegeo", "anio", "region", "idh", "nivel"], idh_rows))
    partes.append(sql_insert("sociedad.vivienda", [
        "cvegeo", "anio", "viviendas_habitadas", "personas_por_vivienda",
        "pct_electricidad", "pct_sin_electricidad", "pct_agua", "pct_sin_agua",
        "pct_drenaje", "pct_sin_drenaje", "pct_internet", "pct_computadora", "pct_celular",
    ], viv))
    partes.append(sql_insert("sociedad.educacion", [
        "cvegeo", "anio", "grado_promedio_anios", "tasa_alfabetizacion",
        "pct_basica", "pct_media_superior", "pct_superior",
    ], edu))
    partes.append(sql_insert("sociedad.migracion", [
        "cvegeo", "anio", "pct_viv_remesas", "pct_viv_emigrantes_eu", "pct_viv_circulares",
        "pct_viv_retorno", "indice_iim", "grado_iim", "lugar_nacional",
        "remesas_usd_millones", "anio_remesas",
    ], mig))
    partes.append(sql_insert("sociedad.marginacion", [
        "cvegeo", "anio", "indice", "grado", "lugar_estatal", "lugar_nacional",
    ], mar))
    partes.append(sql_insert("sociedad.carencia", [
        "cvegeo", "anio", "carencia", "poblacion_con_carencia", "pct_poblacion",
    ], car))
    partes.append(sql_insert("economia.empleo", ["cvegeo", "anio", "pct_pea", "pct_ocupada", "pct_ocupada_informal"], emp))
    partes.append(sql_insert("economia.desigualdad", ["cvegeo", "anio", "gini", "razon_ingreso"], des))
    partes.append(sql_insert("economia.pbt", ["cvegeo", "anio", "sector", "pbt_mdp", "pct_sector", "unidades_economicas"], pbt))
    partes.append(sql_insert("economia.agricola", [
        "cvegeo", "anio", "upa_activas", "upa_cielo_abierto", "superficie_sembrada_ha",
        "superficie_cosechada_ha", "produccion_ton",
    ], agr))
    partes.append(sql_insert("economia.ganadera", ["cvegeo", "anio", "especie", "viviendas", "cabezas"], gan))
    partes.append(sql_insert("economia.ue_tamano", ["cvegeo", "anio", "tamano", "total", "pct"], uet))
    partes.append(sql_insert("economia.ue_actividad", ["cvegeo", "anio", "actividad", "total", "pct"], uea))
    partes.append(sql_insert("gobierno.finanzas", [
        "cvegeo", "anio_autonomia", "autonomia_pct", "anio_dependencia",
        "dependencia_aportaciones_pct", "anio_presupuesto", "presupuesto_ejercido",
    ], fin))
    partes.append(sql_insert("gobierno.tramite", ["cvegeo", "anio", "tipo", "cantidad"], tra))
    partes.append(sql_insert("gobierno.servicio", ["cvegeo", "anio", "alumbrado_pct", "agua_pct", "drenaje_pct"], ser))
    partes.append(sql_insert("gobierno.delito", ["cvegeo", "anio", "categoria", "cantidad"], deli))
    partes.append(sql_insert("gobierno.seguridad", [
        "cvegeo", "anio", "presupuesto_administracion", "presupuesto_seguridad", "pct_seguridad",
    ], seg))
    partes.append("COMMIT;\n")
    return "".join(partes), {
        "poblacion": len(pob), "edad": len(edad), "etnicidad": len(etn), "idh": len(idh_rows),
        "vivienda": len(viv), "educacion": len(edu), "migracion": len(mig), "marginacion": len(mar),
        "carencia": len(car), "empleo": len(emp), "desigualdad": len(des), "pbt": len(pbt),
        "agricola": len(agr), "ganadera": len(gan), "ue_tamano": len(uet), "ue_actividad": len(uea),
        "finanzas": len(fin), "tramite": len(tra), "servicio": len(ser), "delito": len(deli),
        "seguridad": len(seg),
    }


def main():
    archivos = sorted(f for f in os.listdir(PDF_DIR) if f.lower().endswith(".pdf"))
    datos = []
    for nombre in archivos:
        cve = f"{18000 + int(nombre[:3]):05d}"
        print(f"leyendo {nombre} {cve}", flush=True)
        d = parse_pdf(os.path.join(PDF_DIR, nombre), cve)
        datos.append(d)
        print(" ", ", ".join(d["avisos"]) if d["avisos"] else "completo", flush=True)

    sql, cuentas = construir_sql(datos)
    destino = os.path.join(os.path.dirname(__file__), "datos_cuadernillos.sql")
    with open(destino, "w", encoding="utf-8") as f:
        f.write(sql)
    print("SQL", destino)
    print(cuentas)

    if "--cargar" in sys.argv:
        subprocess.run(
            ["docker", "cp", destino, f"{CONTAINER}:/tmp/datos_cuadernillos.sql"],
            check=True,
        )
        subprocess.run(
            ["docker", "exec", "-u", "postgres", CONTAINER,
             "psql", "-d", "iplanay", "-v", "ON_ERROR_STOP=1", "-f", "/tmp/datos_cuadernillos.sql"],
            check=True,
        )
        print("cargado")


if __name__ == "__main__":
    main()
