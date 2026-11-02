-- Tablas para presentar sociedad, economia y gobierno por municipio.
-- cvegeo referencia mg.municipio(cvegeo). Las vistas agregan el nombre del municipio.

BEGIN;

CREATE SCHEMA sociedad;
CREATE SCHEMA economia;
CREATE SCHEMA gobierno;

-- Sociedad -------------------------------------------------------------------

CREATE TABLE sociedad.poblacion (
    cvegeo varchar(5) NOT NULL REFERENCES mg.municipio (cvegeo),
    anio smallint NOT NULL,
    hombres integer,
    mujeres integer,
    total integer,
    densidad_hab_km2 numeric,
    PRIMARY KEY (cvegeo, anio)
);
COMMENT ON TABLE sociedad.poblacion IS 'Poblacion por sexo y densidad. Fuente: CONAPO, 2020 y 2025.';

CREATE TABLE sociedad.edad (
    cvegeo varchar(5) NOT NULL REFERENCES mg.municipio (cvegeo),
    anio smallint NOT NULL,
    rango text NOT NULL,
    hombres integer,
    mujeres integer,
    PRIMARY KEY (cvegeo, anio, rango)
);
COMMENT ON TABLE sociedad.edad IS 'Poblacion por rango de edad y sexo. Fuente: CONAPO.';

CREATE TABLE sociedad.etnicidad (
    cvegeo varchar(5) NOT NULL REFERENCES mg.municipio (cvegeo),
    anio smallint NOT NULL,
    grupo text NOT NULL,
    total integer,
    hombres integer,
    mujeres integer,
    PRIMARY KEY (cvegeo, anio, grupo)
);
COMMENT ON TABLE sociedad.etnicidad IS 'Hablantes de lengua indigena y afrodescendientes, 3 anos y mas. Fuente: Censo 2020.';

CREATE TABLE sociedad.idh (
    cvegeo varchar(5) NOT NULL REFERENCES mg.municipio (cvegeo),
    anio smallint NOT NULL,
    region text,
    idh numeric,
    nivel text,
    PRIMARY KEY (cvegeo, anio)
);
COMMENT ON TABLE sociedad.idh IS 'Indice de desarrollo humano y region del cuadernillo. Fuente: PNUD.';

CREATE TABLE sociedad.vivienda (
    cvegeo varchar(5) NOT NULL REFERENCES mg.municipio (cvegeo),
    anio smallint NOT NULL,
    viviendas_habitadas integer,
    personas_por_vivienda numeric,
    pct_electricidad numeric,
    pct_sin_electricidad numeric,
    pct_agua numeric,
    pct_sin_agua numeric,
    pct_drenaje numeric,
    pct_sin_drenaje numeric,
    pct_internet numeric,
    pct_computadora numeric,
    pct_celular numeric,
    PRIMARY KEY (cvegeo, anio)
);
COMMENT ON TABLE sociedad.vivienda IS 'Vivienda y servicios. pct_celular se refiere a poblacion, no a viviendas. Fuente: Censo 2020.';

CREATE TABLE sociedad.educacion (
    cvegeo varchar(5) NOT NULL REFERENCES mg.municipio (cvegeo),
    anio smallint NOT NULL,
    grado_promedio_anios numeric,
    tasa_alfabetizacion numeric,
    pct_basica numeric,
    pct_media_superior numeric,
    pct_superior numeric,
    PRIMARY KEY (cvegeo, anio)
);
COMMENT ON TABLE sociedad.educacion IS 'Escolaridad. Fuente: Censo 2020.';

CREATE TABLE sociedad.migracion (
    cvegeo varchar(5) NOT NULL REFERENCES mg.municipio (cvegeo),
    anio smallint NOT NULL,
    pct_viv_remesas numeric,
    pct_viv_emigrantes_eu numeric,
    pct_viv_circulares numeric,
    pct_viv_retorno numeric,
    indice_iim numeric,
    grado_iim text,
    lugar_nacional integer,
    remesas_usd_millones numeric,
    anio_remesas smallint,
    PRIMARY KEY (cvegeo, anio)
);
COMMENT ON TABLE sociedad.migracion IS 'Intensidad migratoria 2020 y remesas BANXICO en anio_remesas. Indice y grado se guardan por separado.';

CREATE TABLE sociedad.marginacion (
    cvegeo varchar(5) NOT NULL REFERENCES mg.municipio (cvegeo),
    anio smallint NOT NULL,
    indice numeric,
    grado text,
    lugar_estatal integer,
    lugar_nacional integer,
    PRIMARY KEY (cvegeo, anio)
);
COMMENT ON TABLE sociedad.marginacion IS 'Indice y grado de marginacion. Fuente: CONAPO.';

CREATE TABLE sociedad.carencia (
    cvegeo varchar(5) NOT NULL REFERENCES mg.municipio (cvegeo),
    anio smallint NOT NULL,
    carencia text NOT NULL,
    poblacion_con_carencia integer,
    pct_poblacion numeric,
    PRIMARY KEY (cvegeo, anio, carencia)
);
COMMENT ON TABLE sociedad.carencia IS 'Poblacion que tiene la carencia. No es poblacion con acceso al derecho. Fuente: CONEVAL.';

-- Economia ------------------------------------------------------------------

CREATE TABLE economia.empleo (
    cvegeo varchar(5) NOT NULL REFERENCES mg.municipio (cvegeo),
    anio smallint NOT NULL,
    pct_pea numeric,
    pct_ocupada numeric,
    pct_ocupada_informal numeric,
    PRIMARY KEY (cvegeo, anio)
);
COMMENT ON TABLE economia.empleo IS 'Porcentajes publicados por ILMM. No recalcular la base de cada tasa. Fuente: INEGI.';

CREATE TABLE economia.desigualdad (
    cvegeo varchar(5) NOT NULL REFERENCES mg.municipio (cvegeo),
    anio smallint NOT NULL,
    gini numeric,
    razon_ingreso numeric,
    PRIMARY KEY (cvegeo, anio)
);
COMMENT ON TABLE economia.desigualdad IS 'Coeficiente de Gini y razon de ingreso. La Yesca no trae esta seccion en el cuadernillo. Fuente: CONEVAL.';

CREATE TABLE economia.pbt (
    cvegeo varchar(5) NOT NULL REFERENCES mg.municipio (cvegeo),
    anio smallint NOT NULL,
    sector text NOT NULL,
    pbt_mdp numeric,
    pct_sector numeric,
    unidades_economicas integer,
    PRIMARY KEY (cvegeo, anio, sector)
);
COMMENT ON TABLE economia.pbt IS 'Produccion bruta total en millones de pesos. La suma de sectores puede no coincidir con el total. Fuente: Censos Economicos. No mezclar unidades_economicas con DENUE.';

CREATE TABLE economia.agricola (
    cvegeo varchar(5) NOT NULL REFERENCES mg.municipio (cvegeo),
    anio smallint NOT NULL,
    upa_activas integer,
    upa_cielo_abierto integer,
    superficie_sembrada_ha numeric,
    superficie_cosechada_ha numeric,
    produccion_ton numeric,
    PRIMARY KEY (cvegeo, anio)
);
COMMENT ON TABLE economia.agricola IS 'Produccion agricola. Huajicori no trae esta seccion en el cuadernillo. Fuente: Censo Agropecuario.';

CREATE TABLE economia.ganadera (
    cvegeo varchar(5) NOT NULL REFERENCES mg.municipio (cvegeo),
    anio smallint NOT NULL,
    especie text NOT NULL,
    viviendas integer,
    cabezas integer,
    PRIMARY KEY (cvegeo, anio, especie)
);
COMMENT ON TABLE economia.ganadera IS 'Viviendas con cria y cabezas. El cuadernillo llama Total a la columna de cabezas. Fuente: Censo Agropecuario.';

CREATE TABLE economia.ue_tamano (
    cvegeo varchar(5) NOT NULL REFERENCES mg.municipio (cvegeo),
    anio smallint NOT NULL,
    tamano text NOT NULL,
    total integer,
    pct numeric,
    PRIMARY KEY (cvegeo, anio, tamano)
);
COMMENT ON TABLE economia.ue_tamano IS 'Unidades economicas por tamano. Fuente: DENUE.';

CREATE TABLE economia.ue_actividad (
    cvegeo varchar(5) NOT NULL REFERENCES mg.municipio (cvegeo),
    anio smallint NOT NULL,
    actividad text NOT NULL,
    total integer,
    pct numeric,
    PRIMARY KEY (cvegeo, anio, actividad)
);
COMMENT ON TABLE economia.ue_actividad IS 'Unidades economicas por actividad. Conservar el porcentaje publicado aunque el total sea cero. Fuente: DENUE.';

-- Gobierno ------------------------------------------------------------------

CREATE TABLE gobierno.finanzas (
    cvegeo varchar(5) PRIMARY KEY REFERENCES mg.municipio (cvegeo),
    anio_autonomia smallint,
    autonomia_pct numeric,
    anio_dependencia smallint,
    dependencia_aportaciones_pct numeric,
    anio_presupuesto smallint,
    presupuesto_ejercido numeric
);
COMMENT ON TABLE gobierno.finanzas IS 'Autonomia y dependencia de aportaciones (CONEVAL DataMun) y presupuesto ejercido (Censo de gobiernos municipales). Cada columna trae su ano.';

CREATE TABLE gobierno.tramite (
    cvegeo varchar(5) NOT NULL REFERENCES mg.municipio (cvegeo),
    anio smallint NOT NULL,
    tipo text NOT NULL,
    cantidad integer,
    PRIMARY KEY (cvegeo, anio, tipo)
);
COMMENT ON TABLE gobierno.tramite IS 'Tramites y pagos municipales. En el cuadernillo vienen en texto, no en tabla numerada. Fuente: Censo de gobiernos municipales.';

CREATE TABLE gobierno.servicio (
    cvegeo varchar(5) NOT NULL REFERENCES mg.municipio (cvegeo),
    anio smallint NOT NULL,
    alumbrado_pct numeric,
    agua_pct numeric,
    drenaje_pct numeric,
    PRIMARY KEY (cvegeo, anio)
);
COMMENT ON TABLE gobierno.servicio IS 'Cobertura de alumbrado, agua y drenaje. Fuente: Censo de gobiernos municipales.';

CREATE TABLE gobierno.delito (
    cvegeo varchar(5) NOT NULL REFERENCES mg.municipio (cvegeo),
    anio smallint NOT NULL,
    categoria text NOT NULL,
    cantidad integer,
    PRIMARY KEY (cvegeo, anio, categoria)
);
COMMENT ON TABLE gobierno.delito IS 'Delitos por categoria. Fuente citada en el cuadernillo: INEGI.';

CREATE TABLE gobierno.seguridad (
    cvegeo varchar(5) NOT NULL REFERENCES mg.municipio (cvegeo),
    anio smallint NOT NULL,
    presupuesto_administracion numeric,
    presupuesto_seguridad numeric,
    pct_seguridad numeric,
    PRIMARY KEY (cvegeo, anio)
);
COMMENT ON TABLE gobierno.seguridad IS 'Presupuesto ejercido en administracion publica y en seguridad publica. Tuxpan no trae esta seccion. Fuente: Censo de gobiernos municipales.';

-- Vistas de presentacion ----------------------------------------------------

CREATE VIEW sociedad.v_encabezado AS
SELECT
    m.cvegeo,
    m.cve_ent,
    m.cve_mun,
    m.nomgeo AS municipio,
    p.anio AS anio_poblacion,
    p.total AS poblacion,
    p.densidad_hab_km2,
    i.idh,
    i.nivel AS nivel_idh,
    i.region,
    g.indice AS indice_marginacion,
    g.grado AS grado_marginacion
FROM mg.municipio m
LEFT JOIN LATERAL (
    SELECT anio, total, densidad_hab_km2
    FROM sociedad.poblacion
    WHERE cvegeo = m.cvegeo
    ORDER BY anio DESC
    LIMIT 1
) p ON true
LEFT JOIN LATERAL (
    SELECT idh, nivel, region
    FROM sociedad.idh
    WHERE cvegeo = m.cvegeo
    ORDER BY anio DESC
    LIMIT 1
) i ON true
LEFT JOIN LATERAL (
    SELECT indice, grado
    FROM sociedad.marginacion
    WHERE cvegeo = m.cvegeo
    ORDER BY anio DESC
    LIMIT 1
) g ON true;

COMMENT ON VIEW sociedad.v_encabezado IS 'Ficha de encabezado: municipio, poblacion mas reciente, IDH y marginacion.';

CREATE VIEW sociedad.v_poblacion AS
SELECT m.cvegeo, m.nomgeo AS municipio, p.anio, p.hombres, p.mujeres, p.total, p.densidad_hab_km2
FROM mg.municipio m
LEFT JOIN sociedad.poblacion p ON p.cvegeo = m.cvegeo;

CREATE VIEW sociedad.v_edad AS
SELECT m.cvegeo, m.nomgeo AS municipio, e.anio, e.rango, e.hombres, e.mujeres
FROM mg.municipio m
LEFT JOIN sociedad.edad e ON e.cvegeo = m.cvegeo;

CREATE VIEW sociedad.v_etnicidad AS
SELECT m.cvegeo, m.nomgeo AS municipio, e.anio, e.grupo, e.total, e.hombres, e.mujeres
FROM mg.municipio m
LEFT JOIN sociedad.etnicidad e ON e.cvegeo = m.cvegeo;

CREATE VIEW sociedad.v_idh AS
SELECT m.cvegeo, m.nomgeo AS municipio, i.anio, i.region, i.idh, i.nivel
FROM mg.municipio m
LEFT JOIN sociedad.idh i ON i.cvegeo = m.cvegeo;

CREATE VIEW sociedad.v_vivienda AS
SELECT m.cvegeo, m.nomgeo AS municipio, v.anio, v.viviendas_habitadas, v.personas_por_vivienda,
       v.pct_electricidad, v.pct_sin_electricidad, v.pct_agua, v.pct_sin_agua,
       v.pct_drenaje, v.pct_sin_drenaje, v.pct_internet, v.pct_computadora, v.pct_celular
FROM mg.municipio m
LEFT JOIN sociedad.vivienda v ON v.cvegeo = m.cvegeo;

CREATE VIEW sociedad.v_educacion AS
SELECT m.cvegeo, m.nomgeo AS municipio, e.anio, e.grado_promedio_anios, e.tasa_alfabetizacion,
       e.pct_basica, e.pct_media_superior, e.pct_superior
FROM mg.municipio m
LEFT JOIN sociedad.educacion e ON e.cvegeo = m.cvegeo;

CREATE VIEW sociedad.v_migracion AS
SELECT m.cvegeo, m.nomgeo AS municipio, g.anio, g.pct_viv_remesas, g.pct_viv_emigrantes_eu,
       g.pct_viv_circulares, g.pct_viv_retorno, g.indice_iim, g.grado_iim, g.lugar_nacional,
       g.remesas_usd_millones, g.anio_remesas
FROM mg.municipio m
LEFT JOIN sociedad.migracion g ON g.cvegeo = m.cvegeo;

CREATE VIEW sociedad.v_marginacion AS
SELECT m.cvegeo, m.nomgeo AS municipio, g.anio, g.indice, g.grado, g.lugar_estatal, g.lugar_nacional
FROM mg.municipio m
LEFT JOIN sociedad.marginacion g ON g.cvegeo = m.cvegeo;

CREATE VIEW sociedad.v_carencia AS
SELECT m.cvegeo, m.nomgeo AS municipio, c.anio, c.carencia, c.poblacion_con_carencia, c.pct_poblacion
FROM mg.municipio m
LEFT JOIN sociedad.carencia c ON c.cvegeo = m.cvegeo;

CREATE VIEW economia.v_empleo AS
SELECT m.cvegeo, m.nomgeo AS municipio, e.anio, e.pct_pea, e.pct_ocupada, e.pct_ocupada_informal
FROM mg.municipio m
LEFT JOIN economia.empleo e ON e.cvegeo = m.cvegeo;

CREATE VIEW economia.v_desigualdad AS
SELECT m.cvegeo, m.nomgeo AS municipio, d.anio, d.gini, d.razon_ingreso
FROM mg.municipio m
LEFT JOIN economia.desigualdad d ON d.cvegeo = m.cvegeo;

CREATE VIEW economia.v_pbt AS
SELECT m.cvegeo, m.nomgeo AS municipio, p.anio, p.sector, p.pbt_mdp, p.pct_sector, p.unidades_economicas
FROM mg.municipio m
LEFT JOIN economia.pbt p ON p.cvegeo = m.cvegeo;

CREATE VIEW economia.v_agricola AS
SELECT m.cvegeo, m.nomgeo AS municipio, a.anio, a.upa_activas, a.upa_cielo_abierto,
       a.superficie_sembrada_ha, a.superficie_cosechada_ha, a.produccion_ton
FROM mg.municipio m
LEFT JOIN economia.agricola a ON a.cvegeo = m.cvegeo;

CREATE VIEW economia.v_ganadera AS
SELECT m.cvegeo, m.nomgeo AS municipio, g.anio, g.especie, g.viviendas, g.cabezas
FROM mg.municipio m
LEFT JOIN economia.ganadera g ON g.cvegeo = m.cvegeo;

CREATE VIEW economia.v_ue_tamano AS
SELECT m.cvegeo, m.nomgeo AS municipio, u.anio, u.tamano, u.total, u.pct
FROM mg.municipio m
LEFT JOIN economia.ue_tamano u ON u.cvegeo = m.cvegeo;

CREATE VIEW economia.v_ue_actividad AS
SELECT m.cvegeo, m.nomgeo AS municipio, u.anio, u.actividad, u.total, u.pct
FROM mg.municipio m
LEFT JOIN economia.ue_actividad u ON u.cvegeo = m.cvegeo;

CREATE VIEW gobierno.v_finanzas AS
SELECT m.cvegeo, m.nomgeo AS municipio, f.anio_autonomia, f.autonomia_pct,
       f.anio_dependencia, f.dependencia_aportaciones_pct, f.anio_presupuesto, f.presupuesto_ejercido
FROM mg.municipio m
LEFT JOIN gobierno.finanzas f ON f.cvegeo = m.cvegeo;

CREATE VIEW gobierno.v_tramite AS
SELECT m.cvegeo, m.nomgeo AS municipio, t.anio, t.tipo, t.cantidad
FROM mg.municipio m
LEFT JOIN gobierno.tramite t ON t.cvegeo = m.cvegeo;

CREATE VIEW gobierno.v_servicio AS
SELECT m.cvegeo, m.nomgeo AS municipio, s.anio, s.alumbrado_pct, s.agua_pct, s.drenaje_pct
FROM mg.municipio m
LEFT JOIN gobierno.servicio s ON s.cvegeo = m.cvegeo;

CREATE VIEW gobierno.v_delito AS
SELECT m.cvegeo, m.nomgeo AS municipio, d.anio, d.categoria, d.cantidad
FROM mg.municipio m
LEFT JOIN gobierno.delito d ON d.cvegeo = m.cvegeo;

CREATE VIEW gobierno.v_seguridad AS
SELECT m.cvegeo, m.nomgeo AS municipio, s.anio, s.presupuesto_administracion,
       s.presupuesto_seguridad, s.pct_seguridad
FROM mg.municipio m
LEFT JOIN gobierno.seguridad s ON s.cvegeo = m.cvegeo;

COMMIT;
