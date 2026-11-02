-- 02_crear_tablas.sql
-- Estructura inicial de una base de datos universitaria.

CREATE TABLE IF NOT EXISTS universidad.carreras (
    id_carrera INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    clave VARCHAR(20) NOT NULL UNIQUE,
    nombre VARCHAR(150) NOT NULL,
    nivel VARCHAR(50) NOT NULL DEFAULT 'Licenciatura',
    activo BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS universidad.alumnos (
    id_alumno INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    matricula VARCHAR(20) NOT NULL UNIQUE,
    nombre VARCHAR(80) NOT NULL,
    apellido_paterno VARCHAR(80) NOT NULL,
    apellido_materno VARCHAR(80),
    fecha_nacimiento DATE,
    correo VARCHAR(150) UNIQUE,
    id_carrera INTEGER NOT NULL,
    CONSTRAINT fk_alumno_carrera
        FOREIGN KEY (id_carrera)
        REFERENCES universidad.carreras(id_carrera)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS universidad.profesores (
    id_profesor INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    numero_empleado VARCHAR(20) NOT NULL UNIQUE,
    nombre VARCHAR(80) NOT NULL,
    apellido_paterno VARCHAR(80) NOT NULL,
    apellido_materno VARCHAR(80),
    correo VARCHAR(150) UNIQUE
);

CREATE TABLE IF NOT EXISTS universidad.materias (
    id_materia INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    clave VARCHAR(20) NOT NULL UNIQUE,
    nombre VARCHAR(150) NOT NULL,
    creditos SMALLINT NOT NULL CHECK (creditos > 0),
    horas_semana SMALLINT NOT NULL CHECK (horas_semana > 0)
);

CREATE TABLE IF NOT EXISTS universidad.grupos (
    id_grupo INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    periodo VARCHAR(20) NOT NULL,
    semestre SMALLINT NOT NULL CHECK (semestre > 0),
    id_materia INTEGER NOT NULL,
    id_profesor INTEGER NOT NULL,
    CONSTRAINT fk_grupo_materia
        FOREIGN KEY (id_materia)
        REFERENCES universidad.materias(id_materia)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,
    CONSTRAINT fk_grupo_profesor
        FOREIGN KEY (id_profesor)
        REFERENCES universidad.profesores(id_profesor)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS universidad.inscripciones (
    id_inscripcion INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_alumno INTEGER NOT NULL,
    id_grupo INTEGER NOT NULL,
    fecha_inscripcion DATE NOT NULL DEFAULT CURRENT_DATE,
    calificacion NUMERIC(5,2),
    CONSTRAINT uq_inscripcion UNIQUE (id_alumno, id_grupo),
    CONSTRAINT ck_calificacion
        CHECK (calificacion IS NULL OR (calificacion >= 0 AND calificacion <= 100)),
    CONSTRAINT fk_inscripcion_alumno
        FOREIGN KEY (id_alumno)
        REFERENCES universidad.alumnos(id_alumno)
        ON UPDATE CASCADE
        ON DELETE CASCADE,
    CONSTRAINT fk_inscripcion_grupo
        FOREIGN KEY (id_grupo)
        REFERENCES universidad.grupos(id_grupo)
        ON UPDATE CASCADE
        ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_alumnos_carrera
    ON universidad.alumnos(id_carrera);

CREATE INDEX IF NOT EXISTS idx_grupos_materia
    ON universidad.grupos(id_materia);

CREATE INDEX IF NOT EXISTS idx_grupos_profesor
    ON universidad.grupos(id_profesor);

CREATE INDEX IF NOT EXISTS idx_inscripciones_alumno
    ON universidad.inscripciones(id_alumno);

CREATE INDEX IF NOT EXISTS idx_inscripciones_grupo
    ON universidad.inscripciones(id_grupo);
