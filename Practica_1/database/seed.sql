BEGIN;

INSERT INTO cloudcinema.usuario (nombre_completo, correo, password_md5, foto_perfil) VALUES
    ('Usuario Demo',     'demo@cloudcinema.com', MD5('demo123'), 'Fotos_Perfil/demo.jpg'),
    ('Ana Lopez',        'ana.lopez@gmail.com',  MD5('ana2026'),  'Fotos_Perfil/ana.jpg'),
    ('Carlos Ramirez',   'carlos.r@gmail.com',   MD5('carlos26'), NULL)
ON CONFLICT (correo) DO NOTHING;

INSERT INTO cloudcinema.pelicula (titulo, director, anio_estreno, url_contenido, poster, estado) VALUES
    ('Dune: Part Two',      'Denis Villeneuve',  2024,
     'https://www.youtube.com/watch?v=Way9Dexny3w', 'Fotos_Peliculas/dune_part_two.jpg',   'DISPONIBLE'),
    ('Oppenheimer',         'Christopher Nolan', 2023,
     'https://www.youtube.com/watch?v=uYPbbksJxIg', 'Fotos_Peliculas/oppenheimer.jpg',     'DISPONIBLE'),
    ('Interstellar',        'Christopher Nolan', 2014,
     'https://www.youtube.com/watch?v=zSWdZVtXT7E', 'Fotos_Peliculas/interstellar.jpg',    'DISPONIBLE'),
    ('Parasite',            'Bong Joon-ho',      2019,
     'https://www.youtube.com/watch?v=5xH0HfJHsaY', 'Fotos_Peliculas/parasite.jpg',        'DISPONIBLE'),
    ('Spirited Away',       'Hayao Miyazaki',    2001,
     'https://www.youtube.com/watch?v=ByXuk9QqQkk', 'Fotos_Peliculas/spirited_away.jpg',   'DISPONIBLE'),
    ('The Matrix',          'Lana Wachowski',    1999,
     'https://www.youtube.com/watch?v=vKQi3bBA1y8', 'Fotos_Peliculas/the_matrix.jpg',      'DISPONIBLE'),
    ('Blade Runner 2049',   'Denis Villeneuve',  2017,
     'https://www.youtube.com/watch?v=gCcx85zbxz4', 'Fotos_Peliculas/blade_runner_2049.jpg','DISPONIBLE'),
    ('Avatar 3: Fire and Ash','James Cameron',   2026,
     'https://www.youtube.com/watch?v=d9MyW72ELq0', 'Fotos_Peliculas/avatar_3.jpg',        'PROXIMO_ESTRENO'),
    ('Dune: Part Three',    'Denis Villeneuve',  2027,
     'https://www.youtube.com/watch?v=Way9Dexny3w', 'Fotos_Peliculas/dune_part_three.jpg', 'PROXIMO_ESTRENO')
ON CONFLICT (titulo, director, anio_estreno) DO NOTHING;

INSERT INTO cloudcinema.lista_reproduccion (id_usuario, id_pelicula)
SELECT u.id_usuario, p.id_pelicula
FROM   cloudcinema.usuario u
JOIN   cloudcinema.pelicula p ON p.titulo IN ('Dune: Part Two', 'Interstellar', 'Parasite')
WHERE  u.correo = 'demo@cloudcinema.com'
ON CONFLICT (id_usuario, id_pelicula) DO NOTHING;

INSERT INTO cloudcinema.lista_reproduccion (id_usuario, id_pelicula)
SELECT u.id_usuario, p.id_pelicula
FROM   cloudcinema.usuario u
JOIN   cloudcinema.pelicula p ON p.titulo IN ('Spirited Away', 'The Matrix')
WHERE  u.correo = 'ana.lopez@gmail.com'
ON CONFLICT (id_usuario, id_pelicula) DO NOTHING;

COMMIT;
