-- 03_insertar_datos.sql
-- Datos de ejemplo para ejercicios de SQL.

INSERT INTO universidad.carreras (clave, nombre, nivel)
VALUES
('ISC', 'Licenciatura en Sistemas Computacionales', 'Licenciatura'),
('ECO', 'Licenciatura en Economía', 'Licenciatura'),
('ADM', 'Licenciatura en Informática', 'Licenciatura')
ON CONFLICT (clave) DO NOTHING;

INSERT INTO universidad.profesores
(numero_empleado, nombre, apellido_paterno, apellido_materno, correo)
VALUES
('P001', 'Ana', 'García', 'López', 'ana.garcia@universidad.edu.mx'),
('P002', 'Carlos', 'Hernández', 'Ruiz', 'carlos.hernandez@universidad.edu.mx'),
('P003', 'María', 'Martínez', 'Sánchez', 'maria.martinez@universidad.edu.mx')
ON CONFLICT (numero_empleado) DO NOTHING;

INSERT INTO universidad.materias
(clave, nombre, creditos, horas_semana)
VALUES
('BD101', 'Fundamentos de Bases de Datos', 8, 5),
('SQL201', 'Lenguaje SQL', 7, 5),
('SIG301', 'Sistemas de Información Geográfica', 8, 5),
('MAT101', 'Matemáticas', 6, 4)
ON CONFLICT (clave) DO NOTHING;

INSERT INTO universidad.alumnos
(matricula, nombre, apellido_paterno, apellido_materno, fecha_nacimiento, correo, id_carrera)
SELECT v.matricula, v.nombre, v.apellido_paterno, v.apellido_materno,
       v.fecha_nacimiento, v.correo, c.id_carrera
FROM (
    VALUES
    ('A001', 'Pedro', 'López', 'Ramírez', DATE '2005-02-15', 'a001@alumnos.edu.mx', 'ISC'),
    ('A002', 'Laura', 'Gómez', 'Sánchez', DATE '2004-08-21', 'a002@alumnos.edu.mx', 'ISC'),
    ('A003', 'Juan', 'Martínez', 'Torres', DATE '2005-01-10', 'a003@alumnos.edu.mx', 'ECO'),
    ('A004', 'Sofía', 'Hernández', 'Díaz', DATE '2004-11-30', 'a004@alumnos.edu.mx', 'ADM')
) AS v(matricula, nombre, apellido_paterno, apellido_materno, fecha_nacimiento, correo, clave_carrera)
JOIN universidad.carreras c ON c.clave = v.clave_carrera
ON CONFLICT (matricula) DO NOTHING;

INSERT INTO universidad.grupos (periodo, semestre, id_materia, id_profesor)
SELECT '2026-1', 1, m.id_materia, p.id_profesor
FROM universidad.materias m
JOIN universidad.profesores p ON p.numero_empleado = 'P001'
WHERE m.clave = 'BD101'
  AND NOT EXISTS (
      SELECT 1
      FROM universidad.grupos g
      WHERE g.periodo = '2026-1'
        AND g.id_materia = m.id_materia
  );

INSERT INTO universidad.grupos (periodo, semestre, id_materia, id_profesor)
SELECT '2026-1', 1, m.id_materia, p.id_profesor
FROM universidad.materias m
JOIN universidad.profesores p ON p.numero_empleado = 'P002'
WHERE m.clave = 'SQL201'
  AND NOT EXISTS (
      SELECT 1
      FROM universidad.grupos g
      WHERE g.periodo = '2026-1'
        AND g.id_materia = m.id_materia
  );

INSERT INTO universidad.inscripciones (id_alumno, id_grupo, calificacion)
SELECT a.id_alumno, g.id_grupo, v.calificacion
FROM (
    VALUES
    ('A001', 'BD101', 92.00),
    ('A002', 'BD101', 88.00),
    ('A001', 'SQL201', 95.00),
    ('A003', 'SQL201', 84.00)
) AS v(matricula, clave_materia, calificacion)
JOIN universidad.alumnos a ON a.matricula = v.matricula
JOIN universidad.materias m ON m.clave = v.clave_materia
JOIN universidad.grupos g
  ON g.id_materia = m.id_materia
 AND g.periodo = '2026-1'
ON CONFLICT (id_alumno, id_grupo) DO NOTHING;
