define(function () {
  "use strict";

  /* Carrusel de mapas temáticos. Solo las capas que existen en la base iplanay. */
  const themes = {
    T1: {
      label: "Marco geoestadístico",
      layers: [
        "centidad",
        "c_selector_municipio",
        "c_selector_localidad",
        "c_selector_lpr",
      ],
      desc: "Entidad, municipios, localidades urbanas y localidades puntuales de Nayarit",
    },
  };

  /* Mapas base, los mismos del geovisor de Compostela. */
  const baseLayers = {
    B1: {
      type: "Wms",
      label: "Topogr&aacute;fico sin sombreado - INEGI",
      img: "mapa_sin_sombreado.jpg",
      url: [
        "https://gaiamapas1.inegi.org.mx/mdmCache/service/wms?",
        "https://gaiamapas3.inegi.org.mx/mdmCache/service/wms?",
        "https://gaiamapas2.inegi.org.mx/mdmCache/service/wms?",
      ],
      layer: "MapaBaseTopograficov61_sinsombreado",
      rights: "Derechos Reservados &copy; INEGI",
      tiled: true,
      legendlayer: [],
      desc: "REPRESENTACION DE RECURSOS NATURALES Y CULTURALES DEL TERRITORIO NACIONAL A ESCALA 1: 250 000, BASADO EN IMAGENES DE SATELITE DEL  2002 Y TRABAJO DE CAMPO REALIZADO EN 2003",
      clasification: "VECTORIAL",
    },
    B2: {
      type: "Wms",
      label: "Topogr&aacute;fico con sombreado - INEGI",
      img: "mapa_con_sombreado.jpg",
      url: [
        "https://gaiamapas1.inegi.org.mx/mdmCache/service/wms?",
        "https://gaiamapas3.inegi.org.mx/mdmCache/service/wms?",
        "https://gaiamapas2.inegi.org.mx/mdmCache/service/wms?",
      ],
      layer: "MapaBaseTopograficov61_consombreado",
      rights: "Derechos Reservados &copy; INEGI",
      tiled: true,
      legendlayer: [],
      clasification: "VECTORIAL",
    },
    B3: {
      type: "Wms",
      label: "Hipsogr&aacute;fico - INEGI",
      img: "baseHipsografico.jpg",
      url: [
        "https://gaiamapas1.inegi.org.mx/mdmCache/service/wms?",
        "https://gaiamapas3.inegi.org.mx/mdmCache/service/wms?",
        "https://gaiamapas2.inegi.org.mx/mdmCache/service/wms?",
      ],
      layer: "MapaBaseHipsografico",
      rights: "&copy; INEGI 2013",
      tiled: true,
      legendlayer: ["img_altimetria.png"],
      desc: "IMAGEN DE RELIEVE QUE MUESTRA UNA COMBINACION DE ELEVACION A TRAVES DE COLORES HIPSOGRAFICOS, GENERADA POR PROCESAMIENTO DEL CONTINUO DE ELEVACIONES MEXICANOS DE 3.0 DE 15 METROS.",
      clasification: "RASTER",
    },
    B4: {
      type: "Wms",
      label: "Ortofotos - INEGI",
      img: "baseOrtos.jpg",
      url: [
        "https://gaiamapas1.inegi.org.mx/mdmCache/service/wms?",
        "https://gaiamapas3.inegi.org.mx/mdmCache/service/wms?",
        "https://gaiamapas2.inegi.org.mx/mdmCache/service/wms?",
      ],
      layer: "MapaBaseOrtofoto",
      rights: "&copy; INEGI 2013",
      tiled: true,
      desc: "CONJUNTO DE IMAGENES AEREAS ORTORECTIFICADAS A DIVERSAS ESCALAS Y RESOLUCIONES, PROVENIENTES DEL ACERVO DE ORTOFOTOS DE INEGI Y QUE CORRESPONDEN A TOMAS REALIZADAS EN EL LAPSO 2005-2012.",
      clasification: "RASTER",
    },
    B6: {
      type: "Esri",
      label: "Esri Map Vectorial",
      img: "Esri.jpg",
      url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/${z}/${y}/${x}",
      rights: "&copy; ESRI",
      clasification: "VECTORIAL",
    },
    B7: {
      type: "Esri",
      label: "Google Sat&eacute;lite",
      img: "Google.jpg",
      url: "https://mt0.google.com/vt/lyrs=s&w=256&h=256&hl=en&style=40,18&x=${x}&y=${y}&z=${z}",
      rights: "&copy; Google",
      clasification: "RASTER",
    },
    B8: {
      type: "Wms",
      label: "Topográfico gris INE-INEGI",
      img: "mapa_gris.jpg",
      url: [
        "https://gaiamapas1.inegi.org.mx/mdmCache/service/wms?",
        "https://gaiamapas3.inegi.org.mx/mdmCache/service/wms?",
        "https://gaiamapas2.inegi.org.mx/mdmCache/service/wms?",
      ],
      layer: "MapaBase_geoelectoral_sl",
      rights: "&copy; INEGI 2017",
      tiled: true,
      desc: "CONJUNTO DE IMAGENES CARTOGÁFICAS DIGITALES DE LA CARTAS TOPOGRÁFICAS ESCALA 1:50,000",
      clasification: "VECTORIAL",
    },
  };

  const layers = {
    groups: {
      GINEGI: {
        label: "Marco geoestadístico",
        btnGroup: true,
        layers: {
          centidad: {
            label: "Nayarit",
            synonymous: ["entidad", "estado", "nayarit"],
            scale: 1,
            position: 1,
            active: true,
          },
          c_selector_municipio: {
            label: "Municipios",
            synonymous: ["municipio", "municipal"],
            scale: 1,
            position: 2,
            active: true,
            texts: {
              scale: 1,
              active: true,
            },
          },
          c_selector_localidad: {
            label: "Localidades urbanas",
            synonymous: ["localidad", "urbana"],
            scale: 1,
            position: 3,
            active: false,
            texts: {
              scale: 1,
              active: false,
            },
          },
          c_selector_lpr: {
            label: "Localidades puntuales",
            synonymous: ["localidad", "rural", "lpr"],
            scale: 1,
            position: 4,
            active: false,
            texts: {
              scale: 1,
              active: false,
            },
          },
        },
      },
    },
  };

  let data = {
    themes,
    baseLayers,
    layers,
  };

  if (typeof treeConfig != "undefined") {
    data = $.extend(data, treeConfig);
  }

  return data;
});
