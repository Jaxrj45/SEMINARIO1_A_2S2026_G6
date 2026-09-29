# Backend Python - TaskFlow + CloudDrive

Backend en **Flask** de la Práctica 2 (Seminario 1). Expone exactamente los mismos endpoints que el backend Node.js, de modo que el balanceador de carga (AWS ELB / Azure Load Balancer) pueda enviar cualquier petición a cualquiera de los dos servidores.

- **Responsable:** Persona 2
- **Estado:** Fase 1 completada (código + pruebas locales `16/16 OK`)

## Estructura del proyecto

```
backend-python/
├── app.py            # Punto de entrada: crea la app Flask y registra las rutas
├── config.py         # Carga de variables de entorno
├── extensions.py     # Instancias compartidas (base de datos)
├── models/           # Modelos de datos: users, tasks, files
├── routes/           # Endpoints agrupados por módulo (health, auth, tasks, files)
├── services/         # Lógica externa (subida de archivos a S3 con boto3)
├── utils/            # Utilidades (generación/validación de JWT, helpers)
├── test_api.py       # Prueba de humo del contrato de la API
├── requirements.txt  # Dependencias
├── .env.example      # Plantilla de variables (el .env real NO se sube a GitHub)
└── .gitignore
```



## Tecnologías

| Componente | Uso |
|---|---|
| Flask + Flask-CORS | API REST y CORS para el frontend estático |
| Flask-SQLAlchemy + PyMySQL | Acceso a Amazon RDS (cambio de motor solo con `DATABASE_URL`) |
| bcrypt | Contraseñas encriptadas (nunca en texto plano) |
| PyJWT (HS256) | Autenticación sin estado, válida en cualquier servidor |
| boto3 | SDK de AWS para subir archivos al bucket S3 |
| gunicorn | Servidor de producción en la VM / EC2 |

## Instalación y ejecución local

```bash
cd Practica_2/backend-python
python -m venv venv
venv\Scripts\activate          # Linux/Mac: source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env           # Windows: copy .env.example .env
python app.py                  # http://127.0.0.1:5000
```

## Variables de entorno

| Variable | Descripción | Ejemplo |
|---|---|---|
| `DATABASE_URL` | Cadena de conexión | `sqlite:///dev.db` (local) / `mysql+pymysql://user:pass@endpoint:3306/taskflow` (RDS) |
| `JWT_SECRET` | Secreto de firma. **Debe ser idéntico en Node y Python** | *(valor compartido, no subir a GitHub)* |
| `JWT_HOURS` | Horas de validez del token | `8` |
| `PORT` | Puerto del servidor | `5000` |
| `AUTO_CREATE_TABLES` | Crea tablas al iniciar. `false` en RDS (el esquema lo define la Persona 3) | `true` |
| `S3_BUCKET` | Bucket público de archivos. Vacío = modo simulación | `practica2semi1...archivosg6` |
| `AWS_REGION` | Región del bucket | `us-east-1` |
| `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` | Credenciales del usuario IAM (solo S3) | *(no subir a GitHub)* |

## Contrato de la API

Autenticación: las rutas protegidas requieren `Authorization: Bearer <token>`.
El token es un JWT HS256 con los claims `sub` (id de usuario, como string), `username` y `exp`.

Errores: siempre `{"error": "mensaje"}` con el código HTTP correspondiente.

| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| GET | `/health` | No | Health probe del balanceador |
| POST | `/api/auth/register` | No | Registro de usuario |
| POST | `/api/auth/login` | No | Inicio de sesión |
| GET | `/api/tasks` | Sí | Lista las tareas del usuario |
| POST | `/api/tasks` | Sí | Crea una tarea |
| PUT | `/api/tasks/:id` | Sí | Edita título y descripción |
| PATCH | `/api/tasks/:id/complete` | Sí | Marca/desmarca como completada |
| DELETE | `/api/tasks/:id` | Sí | Elimina una tarea |
| GET | `/api/files` | Sí | Lista los archivos del usuario |
| POST | `/api/files` | Sí | Sube un archivo (multipart, campo `file`) |
| GET | `/api/files/:id` | Sí | Metadatos y URL pública del archivo |

### Detalle de request / response

**GET `/health`** → `200`
```json
{ "status": "ok", "server": "python" }
```
El campo `server` (`"python"` o `"node"`) permite identificar qué servidor respondió al probar el balanceador.

**POST `/api/auth/register`** (`multipart/form-data` o JSON)
```
username, email, password, confirmPassword, profileImage (archivo) | profileImageUrl (texto)
```
→ `201`
```json
{ "message": "Usuario registrado",
  "user": { "id": 1, "username": "ana", "email": "ana@mail.com", "profileImageUrl": "https://..." } }
```
Errores: `400` (campos faltantes o contraseñas distintas), `409` (usuario existente).

**POST `/api/auth/login`** `{ "username": "ana", "password": "Clave123" }`
→ `200` `{ "token": "<jwt>", "user": { ... } }` · Error: `401`

**POST `/api/tasks`** `{ "title": "Tarea", "description": "..." }`
→ `201`
```json
{ "id": 1, "title": "Tarea", "description": "...", "completed": false, "createdAt": "2026-09-29T15:43:07" }
```
**PUT `/api/tasks/:id`** `{ "title": "...", "description": "..." }` → `200` (tarea) · `404` si no existe o no es del usuario.
**PATCH `/api/tasks/:id/complete`** `{ "completed": true }` → `200` (tarea). Sin body, alterna el estado.
**DELETE `/api/tasks/:id`** → `200` `{ "message": "Tarea eliminada" }` · `404`.

**POST `/api/files`** (`multipart/form-data`, campo `file`, máx. 10 MB) → `201`
```json
{ "id": 1, "name": "nota.txt", "type": "text", "url": "https://<bucket>.s3.<region>.amazonaws.com/...", "createdAt": "..." }
```
`type` es `image`, `text` u `other`. El frontend visualiza el archivo usando `url` (objeto público en S3).

## Decisiones de seguridad y alta disponibilidad

- **Contraseñas:** hash bcrypt (`$2b$`), compatible con la librería `bcrypt` de Node.
- **Autenticación sin estado:** no hay sesiones en memoria. Un usuario puede iniciar sesión en un servidor y ser atendido por el otro.
- **Aislamiento por usuario:** cada consulta filtra por el `user_id` del token.
- **Imágenes:** nunca se guardan en la base de datos; solo la URL del objeto en S3.
- **Secretos:** `.env` y credenciales están en `.gitignore`.

## Pruebas

```bash
python test_api.py                              # contra local (http://127.0.0.1:5000)
BASE_URL=http://<host>:<puerto> python test_api.py   # contra VM, Load Balancer o EC2
# PowerShell: $env:BASE_URL="http://<host>:<puerto>"; python test_api.py
```

Verifica health, registro (incluye duplicado y contraseñas distintas), login, CRUD de tareas, subida y listado de archivos. Resultado esperado: `RESULTADO: TODO OK`.

**Verificado localmente el 29-sep-2026: 16/16 pruebas OK.**

## Estado por fase (Persona 2)

| Fase | Descripción | Estado |
|---|---|---|
| 1 | Backend Python + contrato de API | Completada (local) |
| 2 | Grupo de recursos, VNet, Entra ID y RBAC en Azure | Pendiente |
| 3 | Despliegue en VM de Azure + conexión a RDS | Pendiente |
| 4 | Azure Load Balancer + prueba de failover | Pendiente |
| 5 | EC2 Python en AWS con IAM y Security Group mínimo | Pendiente |
| 6 | Documentación con capturas | Pendiente |