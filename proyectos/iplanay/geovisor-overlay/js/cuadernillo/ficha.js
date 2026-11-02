(function () {
  var fmtEntero = new Intl.NumberFormat("es-MX", { maximumFractionDigits: 0 });
  var fmtNum = new Intl.NumberFormat("es-MX", { maximumFractionDigits: 2 });
  var estado = { paquete: null, carga: null, cvegeo: null, tab: "general", sub: {}, mapa: null, geometria: null, geometriaCarga: null };
  var solicitudMapa = 0;
  var temas = [
    { id: "general", titulo: "General" },
    { id: "sociedad", titulo: "Demográfica" },
    { id: "economia", titulo: "Economía" },
    { id: "gobierno", titulo: "Gobierno" },
  ];
  var subtemas = {
    general: [
      { id: "toponimia", titulo: "Toponimia" },
      { id: "contexto", titulo: "Contexto histórico" },
      { id: "localizacion", titulo: "Localización" },
      { id: "clima", titulo: "Temperatura" },
    ],
    sociedad: [
      { id: "poblacion", titulo: "Población" },
      { id: "etnicidad", titulo: "Etnicidad" },
      { id: "idh", titulo: "IDH" },
      { id: "vivienda", titulo: "Viviendas" },
      { id: "educacion", titulo: "Educación" },
      { id: "migracion", titulo: "Migración" },
      { id: "marginacion", titulo: "Marginación" },
      { id: "carencias", titulo: "Carencias sociales" },
    ],
    economia: [
      { id: "empleo", titulo: "Empleo" },
      { id: "desigualdad", titulo: "Desigualdad" },
      { id: "pbt", titulo: "Producción" },
      { id: "agricola", titulo: "Agrícola" },
      { id: "ganadera", titulo: "Ganadera" },
      { id: "ue_tamano", titulo: "UE por tamaño" },
      { id: "ue_actividad", titulo: "UE por actividad" },
    ],
    gobierno: [
      { id: "finanzas", titulo: "Finanzas" },
      { id: "servicios", titulo: "Servicios" },
      { id: "tramites", titulo: "Trámites" },
      { id: "delitos", titulo: "Delitos" },
      { id: "seguridad", titulo: "Seguridad" },
    ],
  };

  function idSubtema(tema) {
    var lista = subtemas[tema] || [];
    var elegido = estado.sub[tema];
    for (var i = 0; i < lista.length; i++) {
      if (lista[i].id === elegido) return elegido;
    }
    return lista.length ? lista[0].id : "";
  }

  function esc(valor) {
    return String(valor == null ? "" : valor).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function num(valor) {
    if (valor === null || valor === undefined || valor === "") return null;
    var n = Number(valor);
    return isFinite(n) ? n : null;
  }

  function fmt(valor, unidad) {
    if (valor === null || valor === undefined || valor === "") return "—";
    var n = Number(valor);
    if (!isFinite(n)) return esc(valor);
    if (unidad === "porcentaje") return fmtNum.format(n) + " %";
    if (unidad === "pesos" || unidad === "personas" || unidad === "viviendas" || unidad === "tramites" || unidad === "delitos" || unidad === "cabezas" || unidad === "unidades" || unidad === "posicion") {
      return fmtEntero.format(n);
    }
    return fmtNum.format(n);
  }

  function filas(cve, tabla) {
    var ficha = estado.paquete.fichas[cve];
    return (ficha && ficha[tabla]) || [];
  }

  function una(cve, tabla) {
    return filas(cve, tabla)[0] || {};
  }

  function pob(cve, anio) {
    var lista = filas(cve, "poblacion");
    for (var i = 0; i < lista.length; i++) {
      if (Number(lista[i].anio) === anio) return lista[i];
    }
    return {};
  }

  function fuente(tabla, variable) {
    var base = "";
    var catalogo = estado.paquete.catalogo || [];
    for (var i = 0; i < catalogo.length; i++) {
      if (catalogo[i].tabla === tabla && catalogo[i].variable === variable) {
        base = catalogo[i].fuente || "";
        break;
      }
    }
    var nombre = nombreMunicipio(estado.cvegeo);
    var apoyo = base.replace(/\.\s*$/, "");
    var cierre = apoyo ? ", con base a " + apoyo : "";
    return "De acuerdo con los datos presentados en el Cuadernillo Geoestadístico Municipal de " +
      nombre + " (IPLANAY, 2026" + cierre + ").";
  }

  function nombreMunicipio(cve) {
    var features = estado.paquete.municipios.features;
    for (var i = 0; i < features.length; i++) {
      if (features[i].properties.cvegeo === cve) return features[i].properties.nomgeo;
    }
    return cve;
  }

  function icono(clase) {
    if (!clase || !/^fa-[a-z0-9-]+$/.test(clase)) return "";
    return '<i class="fa-solid ' + clase + '" aria-hidden="true"></i>';
  }

  function prosa(texto) {
    if (!texto) return '<p class="vacio">El cuadernillo no publica esta sección.</p>';
    return '<p class="prosa">' + esc(texto) + "</p>";
  }

  function bloque(titulo, cita, cuerpo, clase, simbolo) {
    return '<section class="seccion' + (clase ? " " + clase : "") + '"><h3>' + icono(simbolo) + esc(titulo) + "</h3>" + cuerpo + '<p class="fuente">' + esc(cita) + "</p></section>";
  }

  function metrica(etiqueta, valor, unidad, simbolo) {
    return '<div class="metrica">' + icono(simbolo) + "<div><span>" + esc(etiqueta) + "</span><b>" + fmt(valor, unidad) + "</b></div></div>";
  }

  function tabla(columnas, filasTabla) {
    if (!filasTabla.length) return '<p class="vacio">El cuadernillo no publica esta cifra.</p>';
    var cabeza = columnas.map(function (c) {
      return '<th class="' + (c.num ? "num" : "") + '">' + esc(c.titulo) + "</th>";
    }).join("");
    var cuerpo = filasTabla.map(function (fila) {
      return "<tr>" + columnas.map(function (c) {
        var valor = c.texto ? c.texto(fila) : fmt(fila[c.campo], c.unidad);
        return '<td class="' + (c.num ? "num" : "") + '">' + valor + "</td>";
      }).join("") + "</tr>";
    }).join("");
    return "<table><thead><tr>" + cabeza + "</tr></thead><tbody>" + cuerpo + "</tbody></table>";
  }

  function barras(items) {
    var max = 1;
    items.forEach(function (item) { max = Math.max(max, item.valor || 0); });
    return items.map(function (item) {
      var pct = Math.max(2, ((item.valor || 0) / max) * 100);
      return '<div class="barra"><span>' + esc(item.etiqueta) + "</span><b>" + fmt(item.valor, item.unidad) + '</b><i style="width:' + pct + '%"></i></div>';
    }).join("");
  }

  function rangoClave(rango) {
    if (String(rango).indexOf("85") === 0) return 85;
    return parseInt(rango, 10) || 0;
  }

  function etiquetaRango(rango) {
    if (String(rango).indexOf("85") === 0) return "85 y más";
    var partes = String(rango).split("_");
    return partes.length === 2 ? partes[0] + "–" + partes[1] : rango;
  }

  function notaExtremos(nombre) {
    return '<p class="pista-leyenda">Al centro, ' + esc(nombre) + ". A la izquierda, los dos valores más altos del estado; a la derecha, los dos más bajos.</p>";
  }

  function graficaExtremos(cve, opciones) {
    var lista = [];
    var fichas = estado.paquete.fichas || {};
    Object.keys(fichas).forEach(function (clave) {
      var fila = (fichas[clave][opciones.tabla] || [])[0];
      var valor = fila ? opciones.valor(fila) : null;
      if (valor == null) return;
      lista.push({
        cve: clave,
        nombre: nombreMunicipio(clave),
        valor: valor,
        detalle: opciones.detalle ? opciones.detalle(fila) : ""
      });
    });
    lista.sort(function (a, b) { return b.valor - a.valor || a.nombre.localeCompare(b.nombre, "es"); });
    var propio = null;
    var otros = [];
    lista.forEach(function (item) {
      if (item.cve === cve) propio = item;
      else otros.push(item);
    });
    if (!propio || otros.length < 4) return "";
    var columnas = otros.slice(0, 2).concat([propio], otros.slice(-2));
    var maximo = 0;
    columnas.forEach(function (item) { maximo = Math.max(maximo, item.valor); });
    var barrasGrafica = columnas.map(function (item) {
      var alto = Math.max(12, Math.round((item.valor / maximo) * 120));
      var centro = item.cve === cve ? " centro" : "";
      var detalle = item.detalle ? "<small>" + esc(item.detalle) + "</small>" : "";
      return '<div class="idh-col' + centro + '"><b>' + opciones.texto(item.valor) + '</b><span class="idh-eje"><i style="height:' + alto + 'px"></i></span><span>' + esc(item.nombre) + "</span>" + detalle + "</div>";
    }).join("");
    return '<div class="idh-comparacion">' + barrasGrafica + "</div>" + notaExtremos(nombreMunicipio(cve));
  }

  function graficaPartes(items) {
    var validos = items.filter(function (item) { return item.valor != null; });
    if (!validos.length) return "";
    var maximo = 0;
    validos.forEach(function (item) { maximo = Math.max(maximo, item.valor); });
    if (!maximo) return "";
    return '<div class="idh-comparacion partes">' + validos.map(function (item) {
      var alto = Math.max(12, Math.round((item.valor / maximo) * 120));
      return '<div class="idh-col"><b>' + fmt(item.valor, item.unidad || "porcentaje") + '</b><span class="idh-eje"><i style="height:' + alto + 'px"></i></span><span>' + esc(item.etiqueta) + "</span></div>";
    }).join("") + "</div>";
  }

  function millones(valor) {
    return fmtNum.format(Number(valor) / 1000000) + " mill.";
  }

  function filaAnio(ficha, tabla, anio) {
    var lista = (ficha && ficha[tabla]) || [];
    for (var i = 0; i < lista.length; i++) {
      if (Number(lista[i].anio) === anio) return lista[i];
    }
    return null;
  }

  function campoFicha(ficha, tabla, nombre) {
    var fila = ((ficha && ficha[tabla]) || [])[0];
    return fila ? num(fila[nombre]) : null;
  }

  var mapasTematicos = {
    poblacion: {
      titulo: "Población 2025",
      unidad: "personas",
      sentido: "neutro",
      leer: function (ficha) {
        var fila = filaAnio(ficha, "poblacion", 2025);
        return fila ? num(fila.total) : null;
      }
    },
    densidad: {
      titulo: "Densidad de población 2025",
      unidad: "hab/km²",
      sentido: "neutro",
      leer: function (ficha) {
        var fila = filaAnio(ficha, "poblacion", 2025);
        return fila ? num(fila.densidad_hab_km2) : null;
      }
    },
    idh: {
      titulo: "Índice de desarrollo humano",
      unidad: "indice",
      decimales: 3,
      sentido: "mejor",
      leer: function (ficha) { return campoFicha(ficha, "idh", "idh"); }
    },
    marginacion: {
      titulo: "Índice de marginación",
      unidad: "indice",
      decimales: 2,
      sentido: "mejor",
      nota: "El índice publicado es más alto cuando el grado de marginación es más bajo.",
      leer: function (ficha) { return campoFicha(ficha, "marginacion", "indice"); }
    },
    iim: {
      titulo: "Índice de intensidad migratoria",
      unidad: "indice",
      decimales: 2,
      sentido: "peor",
      leer: function (ficha) { return campoFicha(ficha, "migracion", "indice_iim"); }
    },
    escolaridad: {
      titulo: "Grado promedio de escolaridad",
      unidad: "años",
      decimales: 1,
      sentido: "mejor",
      leer: function (ficha) { return campoFicha(ficha, "educacion", "grado_promedio_anios"); }
    },
    analfabetismo: {
      titulo: "Analfabetismo",
      unidad: "porcentaje",
      decimales: 1,
      sentido: "peor",
      nota: "Es el complemento de la tasa de alfabetización publicada.",
      leer: function (ficha) {
        var tasa = campoFicha(ficha, "educacion", "tasa_alfabetizacion");
        return tasa == null ? null : 100 - tasa;
      }
    },
    electricidad: {
      titulo: "Viviendas con energía eléctrica",
      unidad: "porcentaje",
      sentido: "mejor",
      leer: function (ficha) { return campoFicha(ficha, "vivienda", "pct_electricidad"); }
    },
    internet: {
      titulo: "Viviendas con internet",
      unidad: "porcentaje",
      sentido: "mejor",
      leer: function (ficha) { return campoFicha(ficha, "vivienda", "pct_internet"); }
    },
    pea: {
      titulo: "Población económicamente activa",
      unidad: "porcentaje",
      sentido: "mejor",
      leer: function (ficha) { return campoFicha(ficha, "empleo", "pct_pea"); }
    },
    ocupada: {
      titulo: "Población ocupada",
      unidad: "porcentaje",
      sentido: "mejor",
      leer: function (ficha) { return campoFicha(ficha, "empleo", "pct_ocupada"); }
    },
    informal: {
      titulo: "Ocupación informal",
      unidad: "porcentaje",
      sentido: "peor",
      leer: function (ficha) { return campoFicha(ficha, "empleo", "pct_ocupada_informal"); }
    },
    gini: {
      titulo: "Coeficiente de Gini",
      unidad: "coeficiente",
      decimales: 3,
      sentido: "peor",
      leer: function (ficha) { return campoFicha(ficha, "desigualdad", "gini"); }
    },
    autonomia: {
      titulo: "Autonomía financiera",
      unidad: "porcentaje",
      sentido: "mejor",
      leer: function (ficha) { return campoFicha(ficha, "finanzas", "autonomia_pct"); }
    },
    dependencia: {
      titulo: "Dependencia de aportaciones",
      unidad: "porcentaje",
      sentido: "peor",
      leer: function (ficha) { return campoFicha(ficha, "finanzas", "dependencia_aportaciones_pct"); }
    },
    presupuesto: {
      titulo: "Presupuesto ejercido",
      unidad: "pesos",
      sentido: "neutro",
      texto: millones,
      leer: function (ficha) { return campoFicha(ficha, "finanzas", "presupuesto_ejercido"); }
    },
    alumbrado: {
      titulo: "Alumbrado público",
      unidad: "porcentaje",
      sentido: "mejor",
      leer: function (ficha) { return campoFicha(ficha, "servicio", "alumbrado_pct"); }
    },
    agua: {
      titulo: "Agua potable",
      unidad: "porcentaje",
      sentido: "mejor",
      leer: function (ficha) { return campoFicha(ficha, "servicio", "agua_pct"); }
    },
    drenaje: {
      titulo: "Drenaje y alcantarillado",
      unidad: "porcentaje",
      sentido: "mejor",
      leer: function (ficha) { return campoFicha(ficha, "servicio", "drenaje_pct"); }
    }
  };

  function botonMapa(id, etiqueta) {
    var activo = estado.mapa === id;
    return '<button type="button" class="iplanay-mapa' + (activo ? " activa" : "") + '" data-mapa="' + id + '" data-etiqueta="' + esc(etiqueta) + '">' +
      (activo ? "Quitar mapa" : esc(etiqueta) + " en el mapa") + "</button>";
  }

  function mapasHtml() {
    var html = '<div class="iplanay-mapas">';
    for (var i = 0; i < arguments.length; i += 2) html += botonMapa(arguments[i], arguments[i + 1]);
    return html + "</div>";
  }

  function paleta(n, sentido) {
    var rampas = {
      mejor: ["#edf8e9", "#bae4b3", "#74c476", "#31a354", "#006d2c"],
      peor: ["#fee5d9", "#fcae91", "#fb6a4a", "#de2d26", "#a50f15"],
      neutro: ["#deebf7", "#9ecae1", "#6baed6", "#3182bd", "#08519c"]
    };
    var rampa = rampas[sentido] || rampas.neutro;
    if (n >= rampa.length) return rampa.slice();
    var salida = [];
    for (var i = 0; i < n; i++) {
      salida.push(rampa[Math.round(i * (rampa.length - 1) / Math.max(1, n - 1))]);
    }
    return salida;
  }

  function clasesCuantil(valores, sentido) {
    var orden = valores.slice().sort(function (a, b) { return a - b; });
    var nClases = Math.min(5, orden.length);
    if (!nClases) return [];
    var colores = paleta(nClases, sentido);
    var clases = [];
    for (var i = 0; i < nClases; i++) {
      var inicio = Math.floor(i * orden.length / nClases);
      var fin = Math.floor((i + 1) * orden.length / nClases) - 1;
      clases.push({ min: orden[inicio], max: orden[fin], color: colores[i] });
    }
    return clases;
  }

  function indiceClase(valor, clases) {
    for (var i = 0; i < clases.length; i++) {
      if (valor <= clases[i].max) return i;
    }
    return clases.length - 1;
  }

  function textoMapa(def, valor) {
    if (def.texto) return def.texto(valor);
    if (def.decimales != null) return Number(valor).toFixed(def.decimales);
    return fmt(valor, def.unidad);
  }

  function quitarLeyenda() {
    var leyenda = document.getElementById("iplanay-leyenda-mapa");
    if (leyenda) leyenda.remove();
  }

  function colocarLeyenda() {
    var leyenda = document.getElementById("iplanay-leyenda-mapa");
    if (!leyenda) return;
    var panel = document.querySelector(".dinamicPanel-detail");
    var izquierda = 16;
    if (panel) {
      var borde = panel.getBoundingClientRect().right;
      if (borde > 40 && window.innerWidth - borde >= 280) izquierda = Math.ceil(borde) + 16;
    }
    var herramientas = document.querySelector(".dinamicPanel-toolTabs");
    if (herramientas) {
      var caja = herramientas.getBoundingClientRect();
      if (caja.width > 20 && caja.right > izquierda) izquierda = Math.ceil(caja.right) + 12;
    }
    leyenda.style.left = izquierda + "px";
  }

  function ponerLeyenda(def, clases, hayVacio) {
    quitarLeyenda();
    var filasLeyenda = clases.map(function (clase) {
      var etiqueta = clase.min === clase.max
        ? textoMapa(def, clase.min)
        : textoMapa(def, clase.min) + " – " + textoMapa(def, clase.max);
      return '<li><i style="background:' + clase.color + '"></i><span>' + esc(etiqueta) + "</span></li>";
    }).join("");
    if (hayVacio) {
      filasLeyenda += '<li><i class="vacio"></i><span>Sin dato</span></li>';
    }
    var aside = document.createElement("aside");
    aside.id = "iplanay-leyenda-mapa";
    aside.innerHTML = '<div class="cabecera"><strong>' + esc(def.titulo) + '</strong>' +
      '<button type="button" id="iplanay-leyenda-cerrar" title="Quitar mapa">×</button></div><ul>' +
      filasLeyenda + "</ul>";
    document.body.appendChild(aside);
    colocarLeyenda();
  }

  function quitarMapa() {
    estado.mapa = null;
    solicitudMapa += 1;
    quitarLeyenda();
    if (window.MDM6) MDM6("iplanayTematico", null);
  }

  function geometriaMunicipios() {
    if (estado.geometria) return Promise.resolve(estado.geometria);
    if (!estado.geometriaCarga) {
      estado.geometriaCarga = fetch("/iplanay/api/geometria").then(function (respuesta) {
        if (!respuesta.ok) throw new Error("geometria");
        return respuesta.json();
      }).then(function (coleccion) {
        estado.geometria = coleccion;
        return coleccion;
      }).catch(function (error) {
        estado.geometriaCarga = null;
        throw error;
      });
    }
    return estado.geometriaCarga;
  }

  function aplicarMapa() {
    var id = estado.mapa;
    var def = mapasTematicos[id];
    if (!def || !estado.paquete || !window.MDM6) return;
    var ticket = ++solicitudMapa;
    geometriaMunicipios().then(function (coleccion) {
      if (ticket !== solicitudMapa || estado.mapa !== id) return;
      var fichas = estado.paquete.fichas || {};
      var valores = [];
      var medidas = {};
      (coleccion.features || []).forEach(function (feature) {
        var cve = String(feature.properties.cvegeo);
        var valor = def.leer(fichas[cve]);
        medidas[cve] = valor;
        if (valor != null) valores.push(valor);
      });
      var clases = clasesCuantil(valores, def.sentido);
      var hayVacio = false;
      var copia = JSON.parse(JSON.stringify(coleccion));
      copia.features.forEach(function (feature) {
        var cve = String(feature.properties.cvegeo);
        var valor = medidas[cve];
        var seleccionado = cve === String(estado.cvegeo);
        if (valor == null || !clases.length) {
          hayVacio = true;
          feature.properties.color = "#f4f7fa";
          feature.properties.opacidad = 0.55;
          feature.properties.borde = seleccionado ? "#1c2430" : "#b7c2cc";
          feature.properties.grosor = seleccionado ? 3 : 1;
          return;
        }
        var clase = clases[indiceClase(valor, clases)];
        feature.properties.color = clase.color;
        feature.properties.opacidad = 0.78;
        feature.properties.borde = seleccionado ? "#1c2430" : "#ffffff";
        feature.properties.grosor = seleccionado ? 3 : 1.2;
      });
      MDM6("iplanayTematico", copia);
      ponerLeyenda(def, clases, hayVacio);
    }).catch(function () {
      if (ticket !== solicitudMapa) return;
      quitarLeyenda();
      var aviso = document.createElement("aside");
      aviso.id = "iplanay-leyenda-mapa";
      aviso.innerHTML = '<div class="cabecera"><strong>Mapa temático</strong>' +
        '<button type="button" id="iplanay-leyenda-cerrar" title="Cerrar">×</button></div>' +
        '<p class="nota">No se pudo dibujar el mapa.</p>';
      document.body.appendChild(aviso);
      colocarLeyenda();
    });
  }

  function marcarBotones() {
    document.querySelectorAll(".iplanay-mapa").forEach(function (boton) {
      var id = boton.getAttribute("data-mapa");
      var activo = estado.mapa === id;
      boton.classList.toggle("activa", activo);
      var etiqueta = boton.getAttribute("data-etiqueta") || "Indicador";
      boton.textContent = activo ? "Quitar mapa" : etiqueta + " en el mapa";
    });
  }

  function piramide(filasEdad) {
    var filasOrd = filasEdad.slice().sort(function (a, b) { return rangoClave(b.rango) - rangoClave(a.rango); });
    if (!filasOrd.length) return '<p class="vacio">El cuadernillo no publica la pirámide de edad.</p>';
    var max = 1;
    filasOrd.forEach(function (fila) { max = Math.max(max, fila.hombres || 0, fila.mujeres || 0); });
    var alto = filasOrd.length * 18 + 28;
    var formas = filasOrd.map(function (fila, i) {
      var y = 8 + i * 18;
      var ah = ((fila.hombres || 0) / max) * 180;
      var am = ((fila.mujeres || 0) / max) * 180;
      return '<rect class="hombres" x="' + (240 - ah) + '" y="' + y + '" width="' + ah + '" height="14"></rect>' +
        '<rect class="mujeres" x="260" y="' + y + '" width="' + am + '" height="14"></rect>' +
        '<text class="edad" x="452" y="' + (y + 12) + '" text-anchor="start">' + esc(etiquetaRango(fila.rango)) + "</text>";
    }).join("");
    return '<svg class="piramide" viewBox="0 0 560 ' + alto + '" role="img" aria-label="Pirámide de edad">' + formas +
      '<text x="60" y="' + (alto - 6) + '">Hombres</text><text x="300" y="' + (alto - 6) + '">Mujeres</text></svg>';
  }

  function cuerpoTema(cve) {
    var nombre = nombreMunicipio(cve);
    var idh = una(cve, "idh");
    var margen = una(cve, "marginacion");
    var p25 = pob(cve, 2025);
    var p20 = pob(cve, 2020);
    var vivienda = una(cve, "vivienda");
    var educacion = una(cve, "educacion");
    var migracion = una(cve, "migracion");
    var empleo = una(cve, "empleo");
    var desigualdad = una(cve, "desigualdad");
    var agricola = una(cve, "agricola");
    var finanzas = una(cve, "finanzas");
    var servicio = una(cve, "servicio");
    var seguridad = una(cve, "seguridad");
    var encabezado = '<h2>' + esc(nombre) + "</h2>" +
      '<p class="region">' + esc(idh.region || "Región no publicada") + " · clave " + esc(cve) + "</p>";
    var presentacion = una(cve, "presentacion");

    if (estado.tab === "general") {
      var piezasGeneral = {
        toponimia: bloque("Toponimia", fuente("general.presentacion", "toponimia"), prosa(presentacion.toponimia), "", "fa-book-open"),
        contexto: bloque("Contexto histórico", fuente("general.presentacion", "contexto_historico"), prosa(presentacion.contexto_historico), "", "fa-landmark"),
        localizacion: bloque("Localización", fuente("general.presentacion", "localizacion"), prosa(presentacion.localizacion), "", "fa-location-dot"),
        clima: bloque("Temperatura y precipitación", fuente("general.presentacion", "temperatura_precipitacion"), prosa(presentacion.temperatura_precipitacion), "", "fa-cloud-sun"),
      };
      return encabezado + (piezasGeneral[idSubtema("general")] || "");
    }

    if (estado.tab === "sociedad") {
      var carencias = filas(cve, "carencia");
      var hombres = num(p25.hombres) || 0;
      var mujeres = num(p25.mujeres) || 0;
      var base = hombres + mujeres || 1;
      var piezasSociedad = {
        poblacion: bloque("Población", fuente("sociedad.poblacion", "total"),
          metrica("Población 2025", p25.total, "personas", "fa-users") +
          metrica("Densidad 2025", p25.densidad_hab_km2, "hab/km²", "fa-city") +
          '<div class="pista-sexo" aria-hidden="true"><span style="width:' + ((hombres / base) * 100) + '%"></span></div>' +
          '<p class="pista-leyenda">Hombres ' + fmt(p25.hombres, "personas") + " · Mujeres " + fmt(p25.mujeres, "personas") + "</p>" +
          '<p class="pista-leyenda">Población 2020: ' + fmt(p20.total, "personas") + (p20.densidad_hab_km2 == null ? "" : " · densidad " + fmt(p20.densidad_hab_km2, "hab/km²")) + "</p>" +
          piramide(filas(cve, "edad")) + mapasHtml("poblacion", "Población", "densidad", "Densidad"), "", "fa-users"),
        etnicidad: bloque("Etnicidad", fuente("sociedad.etnicidad", "total"), tabla([
          { titulo: "Grupo", texto: function (r) { return esc(r.grupo); } },
          { titulo: "Total", campo: "total", unidad: "personas", num: true },
          { titulo: "Hombres", campo: "hombres", unidad: "personas", num: true },
          { titulo: "Mujeres", campo: "mujeres", unidad: "personas", num: true },
        ], filas(cve, "etnicidad")), "", "fa-user-group"),
        idh: bloque("Índice de Desarrollo Humano (IDH)", fuente("sociedad.idh", "idh"),
          (graficaExtremos(cve, {
            tabla: "idh",
            valor: function (fila) { return num(fila.idh); },
            texto: function (valor) { return Number(valor).toFixed(3); },
            detalle: function (fila) { return fila.nivel || ""; }
          }) || '<p class="vacio">El cuadernillo no publica el índice de desarrollo humano.</p>') + mapasHtml("idh", "IDH"), "", "fa-heart"),
        vivienda: bloque("Viviendas", fuente("sociedad.vivienda", "pct_agua"),
          metrica("Internet", vivienda.pct_internet, "porcentaje", "fa-wifi") +
          '<p class="pista-leyenda">Viviendas habitadas ' + fmt(vivienda.viviendas_habitadas, "viviendas") + " · " + fmt(vivienda.personas_por_vivienda, "indice") + " personas por vivienda</p>" +
          tabla([
            { titulo: "Servicio", texto: function (r) { return esc(r.servicio); } },
            { titulo: "Con acceso", campo: "con", unidad: "porcentaje", num: true },
            { titulo: "Sin acceso", campo: "sin", unidad: "porcentaje", num: true },
          ], [
            { servicio: "Energía eléctrica", con: vivienda.pct_electricidad, sin: vivienda.pct_sin_electricidad },
            { servicio: "Agua potable", con: vivienda.pct_agua, sin: vivienda.pct_sin_agua },
            { servicio: "Drenaje", con: vivienda.pct_drenaje, sin: vivienda.pct_sin_drenaje },
            { servicio: "Computadora", con: vivienda.pct_computadora, sin: null },
            { servicio: "Teléfono celular", con: vivienda.pct_celular, sin: null },
          ]) + mapasHtml("electricidad", "Electricidad", "internet", "Internet"), "", "fa-house"),
        educacion: bloque("Educación", fuente("sociedad.educacion", "grado_promedio_anios"),
          metrica("Grado promedio de escolaridad", educacion.grado_promedio_anios, "años", "fa-graduation-cap") +
          metrica("Alfabetización", educacion.tasa_alfabetizacion, "porcentaje", "fa-book-open") +
          graficaPartes([
            { etiqueta: "Básica", valor: num(educacion.pct_basica) },
            { etiqueta: "Media superior", valor: num(educacion.pct_media_superior) },
            { etiqueta: "Superior", valor: num(educacion.pct_superior) }
          ]) +
          tabla([
            { titulo: "Nivel", texto: function (r) { return esc(r.nivel); } },
            { titulo: "Porcentaje", campo: "valor", unidad: "porcentaje", num: true },
          ], [
            { nivel: "Básica", valor: educacion.pct_basica },
            { nivel: "Media superior", valor: educacion.pct_media_superior },
            { nivel: "Superior", valor: educacion.pct_superior },
          ]) + mapasHtml("escolaridad", "Escolaridad", "analfabetismo", "Analfabetismo"), "", "fa-graduation-cap"),
        carencias: bloque("Carencias sociales", fuente("sociedad.carencia", "poblacion_con_carencia"), carencias.length
          ? barras(carencias.map(function (r) { return { etiqueta: r.carencia, valor: num(r.pct_poblacion), unidad: "porcentaje" }; })) + tabla([
            { titulo: "Carencia", texto: function (r) { return esc(r.carencia); } },
            { titulo: "Población con la carencia", campo: "poblacion_con_carencia", unidad: "personas", num: true },
            { titulo: "%", campo: "pct_poblacion", unidad: "porcentaje", num: true },
          ], carencias)
          : '<p class="vacio">El cuadernillo no publica las carencias.</p>', "", "fa-hand-holding-heart"),
        marginacion: bloque("Marginación", fuente("sociedad.marginacion", "indice"),
          graficaExtremos(cve, {
            tabla: "marginacion",
            valor: function (fila) { return num(fila.indice); },
            texto: function (valor) { return Number(valor).toFixed(2); },
            detalle: function (fila) { return fila.grado || ""; }
          }) +
          '<p class="pista-leyenda">Grado: ' + esc(margen.grado || "—") + " · lugar estatal " + fmt(margen.lugar_estatal, "posicion") + " · lugar nacional " + fmt(margen.lugar_nacional, "posicion") + "</p>" +
          mapasHtml("marginacion", "Marginación"), "", "fa-chart-simple"),
        migracion: bloque("Migración", fuente("sociedad.migracion", "indice_iim"),
          metrica("Índice de intensidad migratoria", migracion.indice_iim, "indice", "fa-person-walking") +
          '<p class="pista-leyenda">Grado: ' + esc(migracion.grado_iim || "—") + " · lugar nacional " + fmt(migracion.lugar_nacional, "posicion") + "</p>" +
          mapasHtml("iim", "Intensidad migratoria") +
          tabla([
            { titulo: "Indicador", texto: function (r) { return esc(r.nombre); } },
            { titulo: "Valor", campo: "valor", unidad: "porcentaje", num: true },
          ], [
            { nombre: "Viviendas que reciben remesas", valor: migracion.pct_viv_remesas },
            { nombre: "Viviendas con emigrantes en Estados Unidos", valor: migracion.pct_viv_emigrantes_eu },
            { nombre: "Viviendas con migrantes circulares", valor: migracion.pct_viv_circulares },
            { nombre: "Viviendas con migrantes de retorno", valor: migracion.pct_viv_retorno },
          ]) +
          metrica("Remesas " + (migracion.anio_remesas || 2024), migracion.remesas_usd_millones, "millones de dólares", "fa-money-bill") +
          '<p class="fuente">' + esc(fuente("sociedad.migracion", "remesas_usd_millones")) + "</p>", "", "fa-route"),
      };
      return encabezado + (piezasSociedad[idSubtema("sociedad")] || "");
    }

    if (estado.tab === "economia") {
      var pbt = filas(cve, "pbt");
      var ganadera = filas(cve, "ganadera");
      var tamanos = filas(cve, "ue_tamano");
      var actividades = filas(cve, "ue_actividad");
      var gini = desigualdad.gini == null
        ? '<p class="vacio">El cuadernillo no publica el coeficiente de Gini.</p>'
        : metrica("Coeficiente de Gini", desigualdad.gini, "coeficiente", "fa-scale-balanced");
      var piezasEconomia = {
        empleo: bloque("Empleo", fuente("economia.empleo", "pct_pea"),
          metrica("Población económicamente activa", empleo.pct_pea, "porcentaje", "fa-briefcase") +
          metrica("Población ocupada", empleo.pct_ocupada, "porcentaje", "fa-user-check") +
          metrica("Ocupación informal", empleo.pct_ocupada_informal, "porcentaje", "fa-user-clock") +
          mapasHtml("pea", "PEA", "ocupada", "Ocupada", "informal", "Informal"), "cols-3", "fa-briefcase"),
        desigualdad: bloque("Desigualdad", fuente("economia.desigualdad", "gini"),
          (graficaExtremos(cve, {
            tabla: "desigualdad",
            valor: function (fila) { return num(fila.gini); },
            texto: function (valor) { return Number(valor).toFixed(3); },
            detalle: function () { return ""; }
          }) || gini) +
          '<p class="pista-leyenda">Razón de ingreso: ' + fmt(desigualdad.razon_ingreso, "indice") + "</p>" +
          mapasHtml("gini", "Gini"), "", "fa-scale-balanced"),
        pbt: bloque("Producción bruta total", fuente("economia.pbt", "pbt_mdp"), pbt.length
          ? barras(pbt.filter(function (r) { return r.sector !== "Total municipal"; }).map(function (r) {
            return { etiqueta: r.sector, valor: num(r.pct_sector), unidad: "porcentaje" };
          })) + tabla([
            { titulo: "Sector", texto: function (r) { return esc(r.sector); } },
            { titulo: "Millones de pesos", campo: "pbt_mdp", unidad: "millones", num: true },
            { titulo: "%", campo: "pct_sector", unidad: "porcentaje", num: true },
          ], pbt)
          : '<p class="vacio">El cuadernillo no publica la producción bruta.</p>', "", "fa-industry"),
        agricola: bloque("Producción agrícola", fuente("economia.agricola", "superficie_sembrada_ha"),
          metrica("Superficie sembrada", agricola.superficie_sembrada_ha, "hectáreas", "fa-seedling") +
          tabla([
            { titulo: "Indicador", texto: function (r) { return esc(r.nombre); } },
            { titulo: "Valor", campo: "valor", unidad: "unidades", num: true },
          ], [
            { nombre: "Unidades activas", valor: agricola.upa_activas },
            { nombre: "Unidades a cielo abierto", valor: agricola.upa_cielo_abierto },
            { nombre: "Superficie cosechada (ha)", valor: agricola.superficie_cosechada_ha },
            { nombre: "Producción (ton)", valor: agricola.produccion_ton },
          ]), "", "fa-seedling"),
        ganadera: bloque("Producción ganadera", fuente("economia.ganadera", "cabezas"), ganadera.length
          ? barras(ganadera.map(function (r) { return { etiqueta: r.especie, valor: num(r.cabezas), unidad: "cabezas" }; })) + tabla([
            { titulo: "Especie", texto: function (r) { return esc(r.especie); } },
            { titulo: "Viviendas", campo: "viviendas", unidad: "viviendas", num: true },
            { titulo: "Cabezas", campo: "cabezas", unidad: "cabezas", num: true },
          ], ganadera)
          : '<p class="vacio">El cuadernillo no publica la producción ganadera.</p>', "", "fa-cow"),
        ue_tamano: bloque("Unidades económicas por tamaño", fuente("economia.ue_tamano", "total"), tamanos.length
          ? barras(tamanos.map(function (r) { return { etiqueta: r.tamano, valor: num(r.total), unidad: "unidades" }; }))
          : '<p class="vacio">El cuadernillo no publica las unidades por tamaño.</p>', "", "fa-store"),
        ue_actividad: bloque("Unidades económicas por actividad", fuente("economia.ue_actividad", "total"), actividades.length
          ? barras(actividades.map(function (r) { return { etiqueta: r.actividad, valor: num(r.pct), unidad: "porcentaje" }; })) + tabla([
            { titulo: "Actividad", texto: function (r) { return esc(r.actividad); } },
            { titulo: "Unidades", campo: "total", unidad: "unidades", num: true },
            { titulo: "%", campo: "pct", unidad: "porcentaje", num: true },
          ], actividades)
          : '<p class="vacio">El cuadernillo no publica las unidades por actividad.</p>', "", "fa-shop"),
      };
      return encabezado + (piezasEconomia[idSubtema("economia")] || "");
    }

    var tramites = filas(cve, "tramite");
    var delitos = filas(cve, "delito");
    var presupuestoSeguridad = seguridad.presupuesto_seguridad == null && seguridad.pct_seguridad == null
      ? '<p class="vacio">El cuadernillo no publica el desglose de presupuesto de seguridad.</p>'
      : metrica("Participación en el presupuesto", seguridad.pct_seguridad, "porcentaje", "fa-shield-halved") +
        graficaExtremos(cve, {
          tabla: "seguridad",
          valor: function (fila) { return num(fila.pct_seguridad); },
          texto: function (valor) { return fmt(valor, "porcentaje"); },
          detalle: function () { return ""; }
        }) +
        '<p class="pista-leyenda">Administración ' + fmt(seguridad.presupuesto_administracion, "pesos") + " pesos · seguridad " + fmt(seguridad.presupuesto_seguridad, "pesos") + " pesos</p>";
    var piezasGobierno = {
      finanzas: bloque("Finanzas", fuente("gobierno.finanzas", "presupuesto_ejercido"),
        metrica("Autonomía financiera " + (finanzas.anio_autonomia || ""), finanzas.autonomia_pct, "porcentaje", "fa-scale-balanced") +
        metrica("Dependencia de aportaciones " + (finanzas.anio_dependencia || ""), finanzas.dependencia_aportaciones_pct, "porcentaje", "fa-hand-holding-dollar") +
        metrica("Presupuesto ejercido " + (finanzas.anio_presupuesto || ""), finanzas.presupuesto_ejercido, "pesos", "fa-money-bill") +
        mapasHtml("autonomia", "Autonomía", "dependencia", "Dependencia", "presupuesto", "Presupuesto") +
        graficaExtremos(cve, {
          tabla: "finanzas",
          valor: function (fila) { return num(fila.autonomia_pct); },
          texto: function (valor) { return fmt(valor, "porcentaje"); },
          detalle: function () { return "Autonomía"; }
        }) +
        graficaExtremos(cve, {
          tabla: "finanzas",
          valor: function (fila) { return num(fila.dependencia_aportaciones_pct); },
          texto: function (valor) { return fmt(valor, "porcentaje"); },
          detalle: function () { return "Dependencia"; }
        }) +
        graficaExtremos(cve, {
          tabla: "finanzas",
          valor: function (fila) { return num(fila.presupuesto_ejercido); },
          texto: millones,
          detalle: function () { return "Presupuesto"; }
        }), "cols-3", "fa-coins"),
      servicios: bloque("Servicios públicos", fuente("gobierno.servicio", "drenaje_pct"),
        metrica("Alumbrado público", servicio.alumbrado_pct, "porcentaje", "fa-lightbulb") +
        metrica("Agua potable", servicio.agua_pct, "porcentaje", "fa-faucet") +
        metrica("Drenaje y alcantarillado", servicio.drenaje_pct, "porcentaje", "fa-faucet-drip") +
        mapasHtml("alumbrado", "Alumbrado", "agua", "Agua", "drenaje", "Drenaje"), "cols-3", "fa-faucet"),
      tramites: bloque("Trámites", fuente("gobierno.tramite", "cantidad"), tramites.length
        ? barras(tramites.map(function (r) { return { etiqueta: r.tipo, valor: num(r.cantidad), unidad: "tramites" }; })) + tabla([
          { titulo: "Tipo", texto: function (r) { return esc(r.tipo); } },
          { titulo: "Cantidad", campo: "cantidad", unidad: "tramites", num: true },
        ], tramites)
        : '<p class="vacio">El cuadernillo no publica conteos de trámites.</p>', "", "fa-file-lines"),
      delitos: bloque("Delitos", fuente("gobierno.delito", "cantidad"), delitos.length
        ? barras(delitos.map(function (r) { return { etiqueta: r.categoria, valor: num(r.cantidad), unidad: "delitos" }; }))
        : '<p class="vacio">El cuadernillo no publica los delitos.</p>', "", "fa-shield-halved"),
      seguridad: bloque("Presupuesto de seguridad pública", fuente("gobierno.seguridad", "presupuesto_seguridad"), presupuestoSeguridad, "", "fa-shield-halved"),
    };
    return encabezado + (piezasGobierno[idSubtema("gobierno")] || "");
  }

  function htmlFicha() {
    var pestanas = temas.map(function (tema) {
      return '<button type="button" data-tema="' + tema.id + '" class="' + (estado.tab === tema.id ? "activa" : "") + '">' + tema.titulo + "</button>";
    }).join("");
    var activo = idSubtema(estado.tab);
    var sub = (subtemas[estado.tab] || []).map(function (item) {
      return '<button type="button" data-sub="' + item.id + '" class="' + (activo === item.id ? "activa" : "") + '">' + item.titulo + "</button>";
    }).join("");
    var pie = estado.tab === "general"
      ? '<div class="iplanay-pie"><a class="iplanay-descarga" href="/iplanay/api/cuadernillo?cvegeo=' + encodeURIComponent(estado.cvegeo) + '">' +
        '<i class="fa-solid fa-file-arrow-down" aria-hidden="true"></i> Descargar cuadernillo</a></div>'
      : "";
    return '<div class="iplanay-nav"><div class="iplanay-pestanas">' + pestanas + '</div><div class="iplanay-subpestanas">' + sub + "</div></div>" +
      '<div class="iplanay-cuerpo">' + cuerpoTema(estado.cvegeo) + "</div>" + pie;
  }

  function apartarMapa() {
    var panel = document.querySelector(".dinamicPanel-detail");
    var medio = document.getElementById("middle");
    if (!panel || !medio || !window.MDM6) return;
    var borde = Math.ceil(panel.getBoundingClientRect().right);
    var cabe = window.innerWidth - borde >= 280;
    if (!cabe) {
      soltarControles();
      if (medio.style.left) {
        medio.style.left = "";
        MDM6("updateSize");
      }
      return;
    }
    if (!estado.vistaPrevia) {
      var centro = MDM6("getCenter");
      if (centro) {
        estado.vistaPrevia = {
          lon: centro.lon,
          lat: centro.lat,
          zoom: MDM6("getZoomLevel") - 1
        };
      }
    }
    medio.style.left = borde + "px";
    anclarControles(borde);
    MDM6("iplanayPanLibre", true);
    MDM6("updateSize");
  }

  function encuadrarMunicipio(caja) {
    if (!caja || caja.xmin == null || !window.MDM6) return;
    MDM6("iplanayPanLibre", true);
    var ancho = Number(caja.xmax) - Number(caja.xmin);
    var alto = Number(caja.ymax) - Number(caja.ymin);
    var holguraX = Math.max(ancho * 0.12, 800);
    var holguraY = Math.max(alto * 0.12, 800);
    MDM6("zoomToExtent", null, [
      Number(caja.xmin) - holguraX,
      Number(caja.ymin) - holguraY,
      Number(caja.xmax) + holguraX,
      Number(caja.ymax) + holguraY
    ]);
  }

  function moverBarra(selector, izquierda, importante) {
    document.querySelectorAll(selector).forEach(function (el) {
      if (izquierda == null) {
        el.style.removeProperty("left");
        return;
      }
      el.style.setProperty("left", izquierda + "px", importante ? "important" : "");
    });
  }

  function anclarControles(borde) {
    var buscar = document.getElementById("mdm6DinamicPanel");
    if (buscar) {
      buscar.style.position = "fixed";
      buscar.style.left = "5px";
      buscar.style.top = "10px";
    }
    var nivel = document.querySelector(".infoLevel");
    if (nivel) nivel.style.left = (borde + 16) + "px";
    colocarLeyenda();
    var herramientas = document.querySelector(".dinamicPanel-toolTabs");
    if (herramientas) {
      herramientas.style.position = "fixed";
      herramientas.style.left = (borde + 10) + "px";
      herramientas.style.top = "76px";
      herramientas.style.margin = "0";
      herramientas.style.zIndex = "4000";
    }
    moverBarra(".layerDisplay-container", borde + 86, false);
    moverBarra(".dinamicPanel-compactTool", borde + 86, true);
    moverBarra(".dinamicPanel-detachedResult", borde + 10, true);
  }

  function soltarControles() {
    var buscar = document.getElementById("mdm6DinamicPanel");
    if (buscar) {
      buscar.style.position = "";
      buscar.style.left = "";
      buscar.style.top = "";
    }
    var nivel = document.querySelector(".infoLevel");
    if (nivel) nivel.style.left = "";
    colocarLeyenda();
    var herramientas = document.querySelector(".dinamicPanel-toolTabs");
    if (herramientas) {
      herramientas.style.position = "";
      herramientas.style.left = "";
      herramientas.style.top = "";
      herramientas.style.margin = "";
      herramientas.style.zIndex = "";
    }
    moverBarra(".layerDisplay-container", null, false);
    moverBarra(".dinamicPanel-compactTool", null, true);
    moverBarra(".dinamicPanel-detachedResult", null, true);
  }

  function restaurarMapa() {
    var medio = document.getElementById("middle");
    if (medio) medio.style.left = "";
    soltarControles();
    if (!window.MDM6) {
      estado.vistaPrevia = null;
      return;
    }
    MDM6("iplanayPanLibre", false);
    MDM6("updateSize");
    if (estado.vistaPrevia) {
      var vista = estado.vistaPrevia;
      estado.vistaPrevia = null;
      MDM6("setCenterTo", null, vista.lon, vista.lat, vista.zoom);
    }
  }

  function engancharCierre() {
    var boton = document.getElementById("mdm6DinamicPanel_btnDetailClose");
    if (!boton || boton._iplanayCierre) return;
    boton._iplanayCierre = true;
    boton.addEventListener("click", restaurarMapa);
  }

  var relojMapa = null;
  window.addEventListener("resize", function () {
    if (!document.querySelector(".iplanay-ficha")) return;
    clearTimeout(relojMapa);
    relojMapa = setTimeout(apartarMapa, 150);
  });

  function mostrar(html, alCrear) {
    var $panel = $("#mdm6DinamicPanel");
    if (!$panel.length) return;
    $panel.dinamicPanel("showSearch");
    $panel.dinamicPanel("showDetail", {
      content: '<div class="iplanay-ficha">' + html + "</div>",
      onCreate: function () {
        apartarMapa();
        engancharCierre();
        if (alCrear) alCrear();
      },
    }, "content");
  }

  function pintar() {
    mostrar(htmlFicha(), function () {
      $(".iplanay-pestanas button").on("click", function (evento) {
        estado.tab = $(this).data("tema");
        pintar();
        evento.stopPropagation();
      });
      $(".iplanay-subpestanas button").on("click", function (evento) {
        estado.sub[estado.tab] = $(this).data("sub");
        pintar();
        evento.stopPropagation();
      });
      $(".iplanay-mapa").on("click", function (evento) {
        evento.stopPropagation();
        var id = $(this).data("mapa");
        if (estado.mapa === id) quitarMapa();
        else {
          estado.mapa = id;
          aplicarMapa();
        }
        marcarBotones();
      });
      if (estado.mapa) aplicarMapa();
    });
  }

  function municipioEnPunto(x, y) {
    var url = "/iplanay/api/municipio?x=" + encodeURIComponent(x) + "&y=" + encodeURIComponent(y);
    return fetch(url).then(function (respuesta) {
      if (!respuesta.ok) throw new Error("municipio");
      return respuesta.json();
    });
  }

  function asegurarDatos() {
    if (estado.paquete) return Promise.resolve(estado.paquete);
    if (estado.carga) return estado.carga;
    estado.carga = fetch("/iplanay/api/datos")
      .then(function (respuesta) {
        if (!respuesta.ok) throw new Error("datos");
        return respuesta.json();
      })
      .then(function (paquete) {
        estado.paquete = paquete;
        return paquete;
      });
    return estado.carga;
  }

  $(document).on("click", "#iplanay-leyenda-cerrar", function () {
    quitarMapa();
    marcarBotones();
  });

  window.IplanayCuadernillo = {
    abrir: function (data, mapa) {
      estado.punto = { lon: data.lon, lat: data.lat };
      mostrar('<p class="pista-leyenda">Cargando el cuadernillo…</p>');
      asegurarDatos().then(function () {
        return municipioEnPunto(data.lon, data.lat);
      }).then(function (municipio) {
        if (!municipio || !municipio.cvegeo) {
          mostrar('<p class="vacio">El punto no corresponde a un municipio de Nayarit.</p>');
          return;
        }
        estado.cvegeo = String(municipio.cvegeo);
        pintar();
        encuadrarMunicipio(municipio);
      }).catch(function () {
        estado.carga = null;
        mostrar('<p class="vacio">No se pudo leer la información de los cuadernillos.</p>');
      });
      return true;
    },
  };
})();
