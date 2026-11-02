-- Capas copiadas de la base Compostela (esquema mg).
-- Se ejecuta despues de restaurar entidad, municipios, localidades y lpr.
-- La clave de municipio es mg.municipio.cvegeo (5 digitos, por ejemplo 18004).

BEGIN;

ALTER TABLE mg.municipios RENAME TO municipio;
ALTER TABLE mg.localidades RENAME TO localidad;

ALTER TABLE mg.entidad ADD PRIMARY KEY (gid);
ALTER TABLE mg.municipio ADD PRIMARY KEY (gid);
ALTER TABLE mg.localidad ADD PRIMARY KEY (gid);
ALTER TABLE mg.lpr ADD PRIMARY KEY (gid);

ALTER TABLE mg.entidad ALTER COLUMN cvegeo SET NOT NULL;
ALTER TABLE mg.municipio ALTER COLUMN cvegeo SET NOT NULL;
ALTER TABLE mg.localidad ALTER COLUMN cvegeo SET NOT NULL;

ALTER TABLE mg.entidad ADD CONSTRAINT entidad_cvegeo_key UNIQUE (cvegeo);
ALTER TABLE mg.municipio ADD CONSTRAINT municipio_cvegeo_key UNIQUE (cvegeo);
ALTER TABLE mg.localidad ADD CONSTRAINT localidad_cvegeo_key UNIQUE (cvegeo);

CREATE INDEX entidad_the_geom_gix ON mg.entidad USING gist (the_geom);
CREATE INDEX municipio_the_geom_gix ON mg.municipio USING gist (the_geom);
CREATE INDEX localidad_the_geom_gix ON mg.localidad USING gist (the_geom);
CREATE INDEX lpr_the_geom_gix ON mg.lpr USING gist (the_geom);

ALTER TABLE mg.localidad
    ADD COLUMN cve_municipio varchar(5)
    GENERATED ALWAYS AS (left(cvegeo, 5)) STORED;

ALTER TABLE mg.lpr
    ADD COLUMN cve_municipio varchar(5)
    GENERATED ALWAYS AS (left(cvegeo, 5)) STORED;

ALTER TABLE mg.localidad
    ADD CONSTRAINT localidad_municipio_fkey
    FOREIGN KEY (cve_municipio) REFERENCES mg.municipio (cvegeo);

ALTER TABLE mg.lpr
    ADD CONSTRAINT lpr_municipio_fkey
    FOREIGN KEY (cve_municipio) REFERENCES mg.municipio (cvegeo);

CREATE INDEX localidad_cve_municipio_idx ON mg.localidad (cve_municipio);
CREATE INDEX lpr_cve_municipio_idx ON mg.lpr (cve_municipio);

COMMENT ON TABLE mg.entidad IS 'Poligono de la entidad. Copia de Compostela, esquema mg.';
COMMENT ON TABLE mg.municipio IS 'Poligonos municipales. cvegeo es la clave de union de sociedad, economia y gobierno.';
COMMENT ON TABLE mg.localidad IS 'Poligonos de localidades. cve_municipio son los primeros 5 digitos de cvegeo.';
COMMENT ON TABLE mg.lpr IS 'Puntos de localidad (LPR). cve_municipio son los primeros 5 digitos de cvegeo.';
COMMENT ON COLUMN mg.municipio.cvegeo IS 'Clave INEGI de municipio, 5 digitos (entidad + municipio).';

COMMIT;
