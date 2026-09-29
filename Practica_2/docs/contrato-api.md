# Contrato de API - TaskFlow + CloudDrive

Contrato único que implementan **backends/node** (Persona 1) y **backends/python** (Persona 2). El balanceador puede mandar cualquier petición a cualquiera de los dos servidores, así que ambos deben responder exactamente igual.

- **Responsable:** Persona 1 (Derek)
- **Verificación:** `backends/python/test_api.py` pasa 17/17 contra ambos servidores, usando PostgreSQL con los stored procedures. Un usuario registrado en un servidor inicia sesión en el otro, y el token de uno sirve en el otro.

## 1. Reglas generales

| Tema | Regla |
|---|---|
| Puerto | **5000** en ambos servidores. El Azure Load Balancer usa un solo puerto de backend para todo el pool, así que no puede ser distinto. |
| Health check | `GET /health`, que responde `200`. Es la ruta de health probe en el ELB y en el Azure LB. |
| Prefijo | Todas las rutas de negocio empiezan con `/api`. |
| Formato | JSON (UTF-8). Las subidas usan `multipart/form-data`. |
| Nombres de campo | En inglés y camelCase (`profileImageUrl`, `createdAt`). |
| Fechas | UTC, ISO 8601 sin zona: `"2026-09-29T15:43:07"`. |
| Errores | Siempre `{ "error": "mensaje" }` con el código HTTP que corresponda. |
| Autenticación | Header `Authorization: Bearer <token>`. JWT HS256 con claims `sub` (id del usuario **como string**), `username` y `exp`. |
| JWT_SECRET | Tiene el **mismo valor** en los 4 servidores. Así un token emitido por Node se valida en Python y viceversa. |
| Contraseñas | bcrypt calculado **dentro de la base** con `pgcrypto` (`sp_registrar_usuario` / `sp_login`). Los backends nunca hashean ni comparan contraseñas. |
| Tamaño máximo | 10 MB por archivo. Si se supera, responde `413`. |
| CORS | Abierto (`*`), porque el frontend se sirve desde S3 y desde Blob. |

## 2. Endpoints

| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| GET | `/health` | No | Health probe del balanceador |
| POST | `/api/auth/register` | No | Registro de usuario |
| POST | `/api/auth/login` | No | Inicio de sesión |
| GET | `/api/tasks` | Sí | Lista las tareas del usuario (más recientes primero) |
| POST | `/api/tasks` | Sí | Crea una tarea |
| PUT | `/api/tasks/:id` | Sí | Edita título y/o descripción |
| PATCH | `/api/tasks/:id/complete` | Sí | Marca o desmarca como completada |
| DELETE | `/api/tasks/:id` | Sí | Elimina una tarea |
| GET | `/api/files` | Sí | Lista los archivos del usuario |
| POST | `/api/files` | Sí | Sube un archivo (multipart) **o** registra uno ya subido por serverless (JSON) |
| GET | `/api/files/:id` | Sí | Metadatos y URL pública de un archivo |

Si una tarea o archivo no existe, o existe pero es de otro usuario, la respuesta es `404`.

### GET `/health`

```json
{ "status": "ok", "server": "node" }
```

`server` vale `"node"` o `"python"`. Así se ve qué servidor respondió en la prueba del balanceador.

### POST `/api/auth/register`

Acepta `multipart/form-data` (con foto) o JSON.

| Campo | Tipo | Obligatorio |
|---|---|---|
| `username` | texto, único | Sí |
| `email` | texto | Sí |
| `password` | texto | Sí |
| `confirmPassword` | texto, igual a `password` | Sí |
| `profileImage` | archivo (solo en multipart) | Uno de los dos |
| `profileImageUrl` | URL de una imagen ya subida | Uno de los dos |

`201`:

```json
{
  "message": "Usuario registrado",
  "user": { "id": 1, "username": "ana", "email": "ana@mail.com", "profileImageUrl": "https://..." }
}
```

Errores: `400` si faltan campos o las contraseñas no coinciden. `409` si el usuario ya existe.

### POST `/api/auth/login`

```json
{ "username": "ana", "password": "Clave123" }
```

`200`: `{ "token": "<jwt>", "user": { ...igual que en register } }`. Error: `401` `{ "error": "Credenciales inválidas" }`.

### Tareas

Objeto tarea:

```json
{ "id": 1, "title": "Estudiar", "description": "Cap. 3", "completed": false, "createdAt": "2026-09-29T15:43:07" }
```

| Petición | Body | Respuesta |
|---|---|---|
| `POST /api/tasks` | `{ "title": "...", "description": "..." }` (`title` obligatorio; `createdAt` se genera automáticamente) | `201` tarea |
| `PUT /api/tasks/:id` | `{ "title"?: "...", "description"?: "..." }` | `200` tarea. `400` si `title` viene vacío |
| `PATCH /api/tasks/:id/complete` | `{ "completed": true }`. Sin body, alterna el estado | `200` tarea |
| `DELETE /api/tasks/:id` | Ninguno | `200` `{ "message": "Tarea eliminada" }` |

### Archivos

Objeto archivo:

```json
{ "id": 1, "name": "nota.txt", "type": "text", "url": "https://<bucket>.s3.us-east-1.amazonaws.com/files/1/ab12....txt", "createdAt": "2026-09-29T15:43:07" }
```

`type` vale `image`, `text` u `other`.

**Modo A: subida por el backend** (`multipart/form-data`, campo `file`). El servidor sube el archivo con el SDK a S3 (en la EC2) o a Blob (en la VM de Azure). Responde `201` con el archivo.

**Modo B: registro de un archivo subido por serverless** (JSON). El frontend sube el archivo con Lambda/API Gateway o con Functions/APIM, recibe la URL y la registra:

```json
{ "name": "foto.png", "type": "image", "url": "https://..." }
```

Responde `201` con el archivo. Da `400` si faltan `name` o `url`, si `url` no es http(s) o si `type` no es válido.

**Visualizar:** el frontend usa `url` directamente (el objeto es público). Imágenes con `<img src>`, texto con `fetch(url)`. Para leer texto, el bucket y el contenedor necesitan CORS que permita `GET` desde el origen del frontend.

## 3. Almacenamiento (keys de los objetos)

| Contenido | Key | Quién la sube |
|---|---|---|
| Foto de perfil | `profiles/<uuid><ext>` | Backend |
| Archivo del usuario | `files/<userId>/<uuid><ext>` | Backend |
| Imagen vía serverless | `images/<uuid><ext>` | Lambda / Function de imágenes |
| Texto vía serverless | `texts/<uuid><ext>` | Lambda / Function de texto |

Respuesta sugerida de las funciones serverless (Persona 4): `{ "url": "https://...", "name": "foto.png", "type": "image" }`. Con eso el frontend llama al Modo B sin transformar nada.

## 4. Base de datos (Amazon RDS PostgreSQL + stored procedures)

Una sola base, `taskflow`, compartida por los 4 servidores (2 EC2 + 2 VM). Los scripts están en [`database/`](../database/):

- `schema.sql`: extensión `pgcrypto` y las tablas `users`, `tasks` y `files`.
- `sps/`: un stored procedure por cada función del backend.
- `init.sql`: ejecuta todo en orden (`psql ... -f init.sql`).

Los backends **no escriben SQL**: cada endpoint llama a un SP con `SELECT * FROM sp_x(...)`. Así Node y Python no pueden comportarse distinto.

| Endpoint | Stored procedure | Devuelve |
|---|---|---|
| `POST /api/auth/register` | `sp_registrar_usuario(username, email, password, profile_image_url)` | Usuario. Da `23505` si el username existe (→ 409) |
| `POST /api/auth/login` | `sp_login(username, password)` | Usuario, o 0 filas (→ 401) |
| `GET /api/tasks` | `sp_listar_tareas(user_id)` | Tareas |
| `POST /api/tasks` | `sp_crear_tarea(user_id, title, description)` | Tarea |
| `PUT /api/tasks/:id` | `sp_actualizar_tarea(id, user_id, title, description, set_description)` | Tarea, o 0 filas (→ 404) |
| `PATCH /api/tasks/:id/complete` | `sp_marcar_tarea(id, user_id, completed)`. Con `completed` NULL alterna | Tarea, o 0 filas (→ 404) |
| `DELETE /api/tasks/:id` | `sp_eliminar_tarea(id, user_id)` | `deleted` true/false (→ 404) |
| `GET /api/files` | `sp_listar_archivos(user_id)` | Archivos |
| `POST /api/files` | `sp_registrar_archivo(user_id, name, type, url)` | Archivo |
| `GET /api/files/:id` | `sp_obtener_archivo(id, user_id)` | Archivo, o 0 filas (→ 404) |

Los SP devuelven `created_at` ya formateado en ISO 8601 (UTC). Los backends solo renombran las columnas a camelCase.

## 5. Variables de entorno (mismos nombres en Node y Python)

| Variable | EC2 (AWS) | VM (Azure) |
|---|---|---|
| `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` | Endpoint y credenciales de RDS | Igual |
| `DB_SSL` | `true` (RDS PostgreSQL exige SSL) | `true` |
| `JWT_SECRET` / `JWT_HOURS` | Valor compartido / `8` | Igual |
| `PORT` | `5000` | `5000` |
| `STORAGE_PROVIDER` | `aws` | `azure` |
| `S3_BUCKET`, `AWS_REGION`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY` | Bucket de archivos y llaves del usuario IAM `g6-app-s3` | Vacías |
| `AZURE_STORAGE_CONNECTION_STRING`, `AZURE_STORAGE_CONTAINER` | Vacías | Cuenta de almacenamiento y contenedor de archivos |

## 6. Pendientes por integrante

**Persona 2 (backends/python).** El backend ya usa los SP y soporta `STORAGE_PROVIDER=aws|azure` y el Modo B de archivos. Solo falta desplegarlo con los mismos valores de `.env`.

**Persona 3 (frontend + RDS).** Crear RDS **PostgreSQL**, crear la base `taskflow` y ejecutar `database/init.sql`. Configurar el frontend con dos URLs base: el ELB en el build de S3 y el Azure LB en el build de Blob.

**Persona 4 (serverless).** Hacer que las funciones devuelvan `{ url, name, type }` y usar las keys de la sección 3.
