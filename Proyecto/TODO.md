[ ← Regresar ](README.md)

# TODO - Semi-Social

Quién hace qué, según el plan de división:

- **I1 (Derek)**: base de datos, backend de usuarios y amigos, EC2 de Node
- **I2 (José)**: balanceador, EC2 de Python, chat, traducción e IAM
- **I3 (Jax)**: bucket de imágenes, Lambdas, API Gateway y Rekognition
- **I4 (Miguel)**: frontend, Cognito, Lex y hosting

---

## 1. Integrante 1 (Derek)

- [x] Aprobar el contrato.
- [x] `db/schema.sql` en MySQL con las tablas `usuarios`, `amistades`, `publicaciones`, `etiquetas`, `publicacion_etiquetas`, `comentarios` y `mensajes`. En `usuarios` van `cognito_sub`, `username`, `email` y `dpi` (los tres únicos), `password_md5` y `foto_key`.
- [x] `db/seed.sql` con 3 o 4 usuarios de prueba que ya sean amigos entre ellos.
- [x] `db/docker-compose.yml` con MySQL local que carga el schema y el seed la primera vez. Ver [db/README.md](db/README.md).
- [x] Levantar la base local y revisar que el schema y el seed carguen sin errores.
- [x] Security groups. Seguir [docs/configuracion-security-groups.md](docs/configuracion-security-groups.md):
  - [x] `g6-sg-elb`: HTTP 80 desde cualquier lugar.
  - [x] `g6-sg-backend`: 5000 solo desde `g6-sg-elb` y SSH 22 desde mi IP.
  - [x] `g6-sg-rds`: MySQL 3306 desde `g6-sg-backend` y desde mi IP (para correr los scripts).
- [x] Pasarle los security groups a I2, porque los necesita para el balanceador.
- [x] Crear la RDS MySQL en la VPC por defecto con `g6-sg-rds` y correr `schema.sql` y `seed.sql`. Seguir [docs/configuracion-rds.md](docs/configuracion-rds.md).
- [x] Revisar que mi usuario IAM tenga `G6-PassRole-EC2` y que el rol `Semi-EC2-AppRole` tenga `G6-EC2-App` (ver [docs/configuracion-iam.md](docs/configuracion-iam.md)).
- [ ] Crear la EC2 No. 1 (Node) con `g6-sg-backend` y el rol `Semi-EC2-AppRole`, y dejarla respondiendo `/api/health`. Seguir [backend/node/README.md](backend/node/README.md).
- [x] Esqueleto del backend Node en `backend/node/` (Express + TypeScript): conexión a MySQL en UTC, middleware del JWT, funciones para armar las respuestas `ok` y `fail`, manejo de errores, CORS y `GET /api/health`.
- [x] Rutas en Node:
  - [x] `POST /api/auth/register`: valida, revisa el usuario en Cognito y guarda con MD5.
  - [x] `POST /api/auth/session`: valida el `idToken` de Cognito y devuelve nuestro token.
  - [x] `POST /api/auth/face-session`: llama a `/face/compare` de I3 y devuelve nuestro token.
  - [x] `GET /api/users/me` y `PUT /api/users/me`: el PUT revisa la contraseña, actualiza RDS y luego Cognito.
  - [x] `GET /api/users/discover`.
  - [x] `POST /api/friends/requests`, `GET /api/friends/requests`, `PUT /api/friends/requests/{id}` y `GET /api/friends`.
  - [x] `GET` y `POST /api/posts/{id}/comments`.
- [x] Pasar mis rutas a `backend/python/` sobre el esqueleto de I2, con respuestas idénticas (fechas con `Z`, `true`/`false`, mismos códigos de error).
- [ ] Subir la versión final a la EC2 No. 1 y conectarla a la RDS.
- [ ] Probar con el frontend de verdad: registro, verificación del correo, login, perfil, amigos y comentarios.
- [ ] Armar el `README.md` final con las partes de todos.
- [ ] Apagar la EC2 No. 1 y ver que la app sigue funcionando por el balanceador.
- [ ] Capturas de la EC2 No. 1, la RDS, las tablas y los 3 security groups.
- [ ] README: tabla de integrantes, EC2 No. 1, RDS y security groups.


## 2. Integrante 2 (José)

- [ ] Políticas, roles y usuarios IAM con la cuenta raíz. Seguir [docs/configuracion-iam.md](docs/configuracion-iam.md).
- [x] Esqueleto del backend Python en `backend/python/` (Flask): conexión a MySQL, JWT, respuestas `ok` y `fail`, CORS y `/api/health`. (Lo hizo Derek junto con sus rutas.)
- [ ] EC2 No. 2 con `g6-sg-backend`, Target Group (puerto 5000, health check `/api/health`) y balanceador con `g6-sg-elb`. Seguir [docs/configuracion-balanceador.md](docs/configuracion-balanceador.md).
- [x] En Node: `GET` y `POST /api/posts`, `GET /api/tags` y `POST /api/translate`.
- [x] Chat en Node y en Python (`GET /api/chat/{friendId}/messages` y `WS /api/ws`).
- [x] Pasar posts, tags y translate a Python.
- [ ] Subir la versión final a la EC2 No. 2, poner las variables de entorno en las dos EC2 y ver que el Target Group las tenga a las dos en `healthy`.
- [ ] Apagar la EC2 No. 2 para la prueba de falla.
- [ ] Capturas del balanceador y del Target Group.
- [ ] README: diagrama de arquitectura, usuarios y roles IAM, EC2 No. 2 y balanceador. Revisar el README final contra la rúbrica.

## 3. Integrante 3 (Jax)

- [ ] Bucket `semi1proyecto-g6` con las carpetas `Fotos_Perfil` y `Fotos_Publicadas` públicas para lectura. Seguir [docs/configuracion-s3.md](docs/configuracion-s3.md).
- [ ] Lambdas `upload-profile`, `upload-post` (con etiquetas de Rekognition) y `face-compare` (con `CompareFaces`, mínimo 90 % de similitud). Seguir [docs/configuracion-lambda.md](docs/configuracion-lambda.md).
- [ ] API Gateway (REST API) con las 3 rutas, CORS y API key solo en `/face/compare`. Seguir [docs/configuracion-api-gateway.md](docs/configuracion-api-gateway.md).
- [ ] Pasar la URL de API Gateway y la API key a los demás.
- [ ] Probar subiendo varias imágenes seguidas.
- [ ] Capturas de las Lambdas, API Gateway y S3.
- [ ] README: bucket, Lambdas, API Gateway, etiquetas de Rekognition y prueba del login facial.

## 4. Integrante 4 (Miguel)

- [ ] Proyecto de React en `frontend/` con mocks que lean `contracts/examples/`.
- [ ] User Pool de Cognito con verificación por correo y los atributos `name`, `email` y `custom:dpi`. Seguir [docs/configuracion-cognito.md](docs/configuracion-cognito.md).
- [ ] Pantallas: registro con `username` (foto por archivo o webcam), login con username y contraseña, login facial, feed y crear publicación.
- [ ] Pantallas: comentarios, filtros, buscador de etiquetas, traducir, editar perfil, usuarios y solicitudes, chat y botón del bot.
- [ ] Bot de Lex (horarios, preguntas frecuentes, ubicación y contacto), su Lambda y el Identity Pool. Seguir [docs/configuracion-lex.md](docs/configuracion-lex.md).
- [ ] Quitar los mocks, poner las URLs reales y subir la página al bucket `proyecto-web-g6`.
- [ ] Capturas de Cognito, Lex, el hosting y cada pantalla.
- [ ] Preparar el orden de la demo.
- [ ] README: hosting, Cognito, Lex y aplicación web.

## 5. Todo el grupo

- [ ] Cada quien trabaja en su rama y hace PRs pequeños.
- [ ] No subir el `.env` ni poner llaves, contraseñas o la API key en el README.
- [ ] Poner en el README las librerías que usamos.
- [ ] Cada uno explica su parte a los demás para poder responder las preguntas de la calificación.
- [ ] Prueba de los 13 flujos (sección 5.2 del plan).
- [ ] Nadie cambia código ni configuración desde que empieza la calificación.
