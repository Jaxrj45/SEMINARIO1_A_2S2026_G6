-- =====================================================
-- Semi-Social - Datos de prueba
-- Se corre una sola vez, despues de schema.sql y con las tablas vacias.
--
-- Ojo:
-- - Estos usuarios no existen en Cognito, asi que no pueden iniciar sesion.
--   Sirven para tener gente en "descubrir usuarios", publicaciones en el feed
--   y una solicitud pendiente. Para entrar a la app hay que registrarse.
-- - Las fotos apuntan a Fotos_Perfil/seed/ y Fotos_Publicadas/seed/.
--   Para que se vean, hay que subir imagenes con esos nombres al bucket.
-- - La contrasena de todos es Semi1234!
-- =====================================================

SET NAMES utf8mb4;

USE semisocial;

-- -----------------------------------------------------
-- Usuarios
-- -----------------------------------------------------
INSERT INTO usuarios (id, cognito_sub, username, nombre_completo, email, dpi, password_md5, foto_key, creado_en) VALUES
  (1, '00000000-0000-0000-0000-000000000001', 'ana',    'Ana López',     'ana@semisocial.test',    '1234567890101', MD5('Semi1234!'), 'Fotos_Perfil/seed/ana.jpg',    '2026-10-20 15:00:00'),
  (2, '00000000-0000-0000-0000-000000000002', 'luis',   'Luis Pérez',    'luis@semisocial.test',   '2345678901201', MD5('Semi1234!'), 'Fotos_Perfil/seed/luis.jpg',   '2026-10-20 15:05:00'),
  (3, '00000000-0000-0000-0000-000000000003', 'lucia',  'Lucía Gómez',   'lucia@semisocial.test',  '3456789012301', MD5('Semi1234!'), 'Fotos_Perfil/seed/lucia.jpg',  '2026-10-20 15:10:00'),
  (4, '00000000-0000-0000-0000-000000000004', 'carlos', 'Carlos Méndez', 'carlos@semisocial.test', '4567890123401', MD5('Semi1234!'), 'Fotos_Perfil/seed/carlos.jpg', '2026-10-20 15:15:00');

-- -----------------------------------------------------
-- Amistades
-- ana, luis y lucia son amigos entre ellos.
-- carlos le mando una solicitud a ana que sigue pendiente.
-- -----------------------------------------------------
INSERT INTO amistades (id, solicitante_id, destinatario_id, estado, creado_en, respondido_en) VALUES
  (1, 1, 2, 'accepted', '2026-10-21 10:00:00', '2026-10-21 10:30:00'),
  (2, 3, 1, 'accepted', '2026-10-21 11:00:00', '2026-10-21 11:15:00'),
  (3, 2, 3, 'accepted', '2026-10-21 12:00:00', '2026-10-21 12:20:00'),
  (4, 4, 1, 'pending',  '2026-10-22 09:00:00', NULL);

-- -----------------------------------------------------
-- Publicaciones
-- La 4 no tiene descripcion para probar que es opcional.
-- -----------------------------------------------------
INSERT INTO publicaciones (id, usuario_id, descripcion, imagen_key, creado_en) VALUES
  (1, 1, 'Fin de semana en la playa',      'Fotos_Publicadas/seed/playa.jpg',   '2026-10-22 14:00:00'),
  (2, 2, 'Mi perro después del baño',      'Fotos_Publicadas/seed/perro.jpg',   '2026-10-22 16:30:00'),
  (3, 3, 'La mejor pizza de la zona 1',    'Fotos_Publicadas/seed/pizza.jpg',   '2026-10-23 12:15:00'),
  (4, 1, NULL,                             'Fotos_Publicadas/seed/volcan.jpg',  '2026-10-23 18:45:00'),
  (5, 4, 'Primer día en la facultad',      'Fotos_Publicadas/seed/facultad.jpg', '2026-10-23 20:00:00');

-- -----------------------------------------------------
-- Etiquetas (como las devolveria Rekognition)
-- -----------------------------------------------------
INSERT INTO etiquetas (id, nombre) VALUES
  (1,  'Beach'),
  (2,  'Sea'),
  (3,  'Outdoors'),
  (4,  'Dog'),
  (5,  'Pet'),
  (6,  'Animal'),
  (7,  'Food'),
  (8,  'Pizza'),
  (9,  'Mountain'),
  (10, 'Nature'),
  (11, 'Building'),
  (12, 'Person');

INSERT INTO publicacion_etiquetas (publicacion_id, etiqueta_id) VALUES
  (1, 1), (1, 2), (1, 3), (1, 10),
  (2, 4), (2, 5), (2, 6),
  (3, 7), (3, 8),
  (4, 9), (4, 10), (4, 3),
  (5, 11), (5, 12);

-- -----------------------------------------------------
-- Comentarios (solo entre amigos)
-- -----------------------------------------------------
INSERT INTO comentarios (id, publicacion_id, usuario_id, texto, creado_en) VALUES
  (1, 1, 2, '¡Qué buena foto!',                    '2026-10-22 14:20:00'),
  (2, 1, 3, 'Yo quiero ir la próxima vez',         '2026-10-22 15:00:00'),
  (3, 2, 1, 'Está muy bonito, ¿cómo se llama?',    '2026-10-22 17:00:00'),
  (4, 2, 2, 'Se llama Toby',                       '2026-10-22 17:05:00'),
  (5, 3, 1, 'Tienes que pasarme la dirección',     '2026-10-23 13:00:00'),
  (6, 4, 2, 'Is this the Acatenango volcano?',     '2026-10-23 19:10:00');

-- -----------------------------------------------------
-- Mensajes del chat
-- -----------------------------------------------------
INSERT INTO mensajes (id, emisor_id, receptor_id, texto, creado_en) VALUES
  (1, 1, 2, 'Hola Luis, ¿vas a ir a la clase de mañana?', '2026-10-23 09:00:00'),
  (2, 2, 1, 'Sí, ahí nos vemos',                          '2026-10-23 09:02:00'),
  (3, 1, 2, 'Perfecto, llevo los apuntes',                '2026-10-23 09:03:00'),
  (4, 3, 1, '¿Ya viste la publicación de la pizza?',      '2026-10-23 12:30:00');
