-- Textos de presentación del cuadernillo: toponimia, contexto histórico,
-- localización y temperatura con precipitación. Una fila por municipio.

BEGIN;

CREATE SCHEMA IF NOT EXISTS general;

CREATE TABLE IF NOT EXISTS general.presentacion (
    cvegeo varchar(5) PRIMARY KEY REFERENCES mg.municipio (cvegeo),
    toponimia text,
    contexto_historico text,
    localizacion text,
    temperatura_precipitacion text
);

COMMENT ON TABLE general.presentacion IS
    'Textos de las primeras secciones del cuadernillo. No se inventa un párrafo si el PDF no lo trae.';

COMMENT ON COLUMN general.presentacion.toponimia IS 'Apartado Toponimia.';
COMMENT ON COLUMN general.presentacion.contexto_historico IS 'Apartado Contexto histórico.';
COMMENT ON COLUMN general.presentacion.localizacion IS 'Apartado Localización.';
COMMENT ON COLUMN general.presentacion.temperatura_precipitacion IS 'Apartado Temperatura y precipitaciones.';

COMMIT;
