-- CloudCinema - Esquema de Base de Datos
-- Motor: MySQL 8.0

CREATE TABLE usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    correo VARCHAR(150) NOT NULL UNIQUE,
    nombre_completo VARCHAR(150) NOT NULL,
    password_hash CHAR(32) NOT NULL,
    foto_perfil_url VARCHAR(255),
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE peliculas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    titulo VARCHAR(200) NOT NULL,
    director VARCHAR(150) NOT NULL,
    anio_estreno INT NOT NULL,
    poster_url VARCHAR(255) NOT NULL,
    url_contenido VARCHAR(255) NOT NULL,
    estado ENUM('Disponible', 'Proximo_estreno') NOT NULL DEFAULT 'Disponible'
);

CREATE TABLE playlist (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    pelicula_id INT NOT NULL,
    agregado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    FOREIGN KEY (pelicula_id) REFERENCES peliculas(id) ON DELETE CASCADE,
    UNIQUE KEY unico_usuario_pelicula (usuario_id, pelicula_id)
);

INSERT INTO peliculas (titulo, director, anio_estreno, poster_url, url_contenido, estado) VALUES
('Pelicula Demo 1', 'Director Demo', 2023, 'Fotos_Peliculas/demo1.jpg', 'https://youtube.com/watch?v=demo1', 'Disponible'),
('Pelicula Demo 2', 'Director Demo 2', 2026, 'Fotos_Peliculas/demo2.jpg', 'https://youtube.com/watch?v=demo2', 'Proximo_estreno');