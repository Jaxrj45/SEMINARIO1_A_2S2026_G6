# Backend Python - TaskFlow + CloudDrive

Backend en **Flask** de la Práctica 2 (Seminario 1). Expone exactamente los mismos endpoints que el backend Node.js, de modo que el balanceador de carga (AWS ELB / Azure Load Balancer) pueda enviar cualquier petición a cualquiera de los dos servidores.

- **Responsable:** Persona 2
- **Estado:** Fase 1 completada (código + pruebas locales contra PostgreSQL `17/17 OK`)

## Estructura del proyecto

```
python/
├── app.py            # Punto de entrada: crea la app Flask y registra las rutas
├── config.py         # Carga de variables de entorno
├── db.py             # Pool de conexiones a RDS PostgreSQL y call_sp()
├── extensions.py     # Instancias compartidas (CORS)
├── routes/           # Endpoints agrupados por módulo (health, auth, tasks, files)
├── services/         # Subida de archivos a S3 (boto3) o Azure Blob
├── utils/            # JWT, serialización de respuestas y helpers
├── test_api.py       # Prueba de humo del contrato de la API
├── requirements.txt  # Dependencias
├── .env.example      # Plantilla de variables (el .env real NO se sube a GitHub)
└── .gitignore
```

El backend no escribe SQL: toda la lógica de datos está en los stored procedures de [`database/`](../../database/). Cada ruta llama a uno con `call_sp("sp_nombre", ...)`.

## Tecnologías

| Componente | Uso |
|---|---|
| Flask + Flask-CORS | API REST y CORS para el frontend estático |
| psycopg2 | Conexión a Amazon RDS PostgreSQL y llamada a los stored procedures |
| pgcrypto (en la BD) | Contraseñas con bcrypt, encriptadas dentro del SP (nunca en texto plano) |
| PyJWT (HS256) | Autenticación sin estado, válida en cualquier servidor |
| boto3 | SDK de AWS para subir archivos al bucket S3 (en la EC2) |
| azure-storage-blob | Subida al contenedor de Blob Storage (en la VM de Azure) |
| gunicorn | Servidor de producción en la VM / EC2 |

## Instalación y ejecución local

Requiere un PostgreSQL con los scripts de `database/` ya ejecutados.

```bash
cd Practica_2/backends/python
python -m venv venv
venv\Scripts\activate          # Linux/Mac: source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env           # Windows: copy .env.example .env
python app.py                  # http://127.0.0.1:5000
```

En producción: `gunicorn -w 2 -b 0.0.0.0:5000 app:app`.

## Variables de entorno

Son las mismas que en `backends/node/.env.example`.

| Variable | Descripción | Ejemplo |
|---|---|---|
| `DB_HOST`, `DB_PORT`, `DB_NAME` | Endpoint de RDS PostgreSQL | `xxx.rds.amazonaws.com`, `5432`, `taskflow` |
| `DB_USER`, `DB_PASSWORD` | Credenciales de la base | *(no subir a GitHub)* |
| `DB_SSL` | `true` en RDS (exige SSL) | `true` |
| `JWT_SECRET` | Secreto de firma. **Debe ser idéntico en Node y Python** | *(valor compartido, no subir a GitHub)* |
| `JWT_HOURS` | Horas de validez del token | `8` |
| `PORT` | Puerto del servidor, **5000 en todos** | `5000` |
| `STORAGE_PROVIDER` | `aws` en la EC2, `azure` en la VM de Azure | `aws` |
| `S3_BUCKET`, `AWS_REGION` | Bucket público de archivos. Vacío = modo simulación | `practica2semi1...archivosg6` |
| `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` | Llaves del usuario IAM de la app (solo S3) | *(no subir a GitHub)* |
| `AZURE_STORAGE_CONNECTION_STRING` | Cadena de conexión de la cuenta de almacenamiento. Vacío = simulación | *(no subir a GitHub)* |
| `AZURE_STORAGE_CONTAINER` | Contenedor de archivos | `practica2semi1...archivosg6` |

## Contrato de la API

La referencia completa, con request/response de cada endpoint, está en [docs/contrato-api.md](../../docs/contrato-api.md).

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
| POST | `/api/files` | Sí | Sube un archivo (multipart `file`) o registra uno subido por serverless (JSON `{name, type, url}`) |
| GET | `/api/files/:id` | Sí | Metadatos y URL pública del archivo |

## Decisiones de seguridad y alta disponibilidad

- **Contraseñas:** bcrypt con `pgcrypto` dentro de `sp_registrar_usuario`. `sp_login` verifica sin que el hash salga de la base.
- **Autenticación sin estado:** no hay sesiones en memoria. Un usuario puede iniciar sesión en un servidor y ser atendido por el otro.
- **Aislamiento por usuario:** todos los SP filtran por el `user_id` del token.
- **Imágenes:** nunca se guardan en la base de datos, solo la URL del objeto en S3/Blob.
- **Secretos:** `.env` y credenciales están en `.gitignore`.

## Pruebas

```bash
python test_api.py                                   # contra local (http://127.0.0.1:5000)
BASE_URL=http://<host>:<puerto> python test_api.py   # contra VM, Load Balancer o EC2
# PowerShell: $env:BASE_URL="http://<host>:<puerto>"; python test_api.py
```

Verifica health, registro (incluye duplicado y contraseñas distintas), login, CRUD de tareas, subida y listado de archivos. Resultado esperado: `RESULTADO: TODO OK`.

## Estado por fase (Persona 2)

| Fase | Descripción | Estado |
|---|---|---|
| 1 | Backend Python + contrato de API | Completada (local, PostgreSQL + SP) |
| 2 | Grupo de recursos, VNet, Entra ID y RBAC en Azure | Pendiente |
| 3 | Despliegue en VM de Azure + conexión a RDS | Pendiente |
| 4 | Azure Load Balancer + prueba de failover | Pendiente |
| 5 | EC2 Python en AWS con IAM y Security Group mínimo | Pendiente |
| 6 | Documentación con capturas | Pendiente |
