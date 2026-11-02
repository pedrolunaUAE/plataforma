-- 04_consultas_prueba.sql
-- Consultas para comprobar que la base fue restaurada correctamente.

-- 1. Carreras
SELECT *
FROM universidad.carreras
ORDER BY id_carrera;

-- 2. Alumnos con su carrera
SELECT
    a.matricula,
    a.nombre,
    a.apellido_paterno,
    c.nombre AS carrera
FROM universidad.alumnos a
JOIN universidad.carreras c
  ON c.id_carrera = a.id_carrera
ORDER BY a.matricula;

-- 3. Grupos con materia y profesor
SELECT
    g.periodo,
    m.clave AS clave_materia,
    m.nombre AS materia,
    CONCAT(p.nombre, ' ', p.apellido_paterno) AS profesor
FROM universidad.grupos g
JOIN universidad.materias m
  ON m.id_materia = g.id_materia
JOIN universidad.profesores p
  ON p.id_profesor = g.id_profesor
ORDER BY g.periodo, m.clave;

-- 4. Inscripciones con calificación
SELECT
    a.matricula,
    CONCAT(a.nombre, ' ', a.apellido_paterno) AS alumno,
    m.nombre AS materia,
    i.calificacion
FROM universidad.inscripciones i
JOIN universidad.alumnos a
  ON a.id_alumno = i.id_alumno
JOIN universidad.grupos g
  ON g.id_grupo = i.id_grupo
JOIN universidad.materias m
  ON m.id_materia = g.id_materia
ORDER BY a.matricula, m.nombre;
