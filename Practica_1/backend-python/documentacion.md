# CloudCinema — Backend Python (Flask)

**Responsable:** Integrante C
**Stack:** Python 3.14 · Flask · psycopg2 · boto3

---

## 1. Estructura del proyecto

```
backend-python/
├── app.py                  # Punto de entrada, registra los blueprints
├── requirements.txt
├── .env                    # Variables de entorno (no versionado)
├── docker-compose.yml       # Postgres local + LocalStack, solo desarrollo
└── src/
    ├── db.py                # Conexión a PostgreSQL (psycopg2)
    ├── s3_utils.py            # Cliente S3 (boto3), construcción de URLs públicas
    └── routes/
        ├── auth.py            # Registro, login, recuperación de contraseña
        ├── movies.py           # Catálogo de películas (CRUD completo)
        ├── playlist.py         # Lista de reproducción del usuario
        ├── profile.py           # Perfil de usuario
        └── uploads.py            # Subida de fotos a S3
```

## 2. Enfoque del backend

Flask actúa como una capa delgada sobre la base de datos: valida el formato de la petición HTTP, llama al stored procedure correspondiente (`SELECT * FROM sp_algo(...)`), traduce los códigos de error de PostgreSQL a códigos HTTP, y transforma las keys de S3 en URLs públicas antes de responder. La lógica de negocio (duplicados, reglas de estado, verificación de contraseña) vive en los stored procedures, no en Python.

---

## 3. Endpoints

### `auth.py` — `/auth`

| Método | Ruta | Descripción | Códigos |
|---|---|---|---|
| GET | `/auth/check-email?correo=` | Verifica si un correo ya está registrado | 200, 400 |
| POST | `/auth/register` | Registro de usuario | 201, 400, 409 |
| POST | `/auth/login` | Autenticación | 200, 400, 401 |
| POST | `/auth/forgot-password` | Reset de contraseña por correo | 200, 400, 404 |

### `movies.py` — `/movies`

| Método | Ruta | Descripción | Códigos |
|---|---|---|---|
| GET | `/movies?id_usuario=` | Cartelera completa (`id_usuario` opcional para marcar `en_mi_lista`) | 200 |
| GET | `/movies/<id>` | Detalle de una película | 200, 404 |
| POST | `/movies` | Crear película | 201, 400, 409 |
| PUT | `/movies/<id>` | Editar película (parcial) | 200, 400, 404 |
| DELETE | `/movies/<id>` | Eliminar película (cascada a listas) | 200, 404 |

### `playlist.py` — `/playlist`

| Método | Ruta | Descripción | Códigos |
|---|---|---|---|
| POST | `/playlist` | Agregar película a la lista (200 si ya estaba, 201 si es nueva) | 200, 201, 400, 404 |
| GET | `/playlist?id_usuario=` | Listar la lista de un usuario | 200, 400 |
| DELETE | `/playlist/<id_lista>?id_usuario=` | Eliminar una entrada (verifica pertenencia al usuario) | 200, 400, 404 |

### `profile.py` — `/profile`

| Método | Ruta | Descripción | Códigos |
|---|---|---|---|
| GET | `/profile/<id_usuario>` | Ver perfil (incluye conteo de la lista) | 200, 404 |
| PUT | `/profile` | Editar nombre/foto (requiere contraseña actual) | 200, 400, 401, 404 |

### `uploads.py` — `/uploads`

| Método | Ruta | Descripción | Códigos |
|---|---|---|---|
| POST | `/uploads/profile-photo` | Sube una foto (`multipart/form-data`, campo `file`) a `Fotos_Perfil/` en S3 | 201, 400, 500, 502 |

Formatos permitidos: `.jpg`, `.jpeg`, `.png`, `.webp`. Cada archivo se guarda con nombre único (`uuid4`) para evitar colisiones.

---

## 4. Integración con S3

- Las imágenes se guardan como **keys relativas** (ej. `Fotos_Perfil/abc123.jpg`), nunca como URL completa ni binario.
- `build_image_url()` construye la URL pública al responder: `https://{bucket}.s3.{region}.amazonaws.com/{key}`.
- Sin access keys en `.env` de producción: `boto3` toma las credenciales del **IAM Role** de la instancia EC2.
- En desarrollo local se usa LocalStack (S3 emulado en Docker); `boto3` detecta automáticamente `AWS_ENDPOINT_URL` cuando está presente. Esa variable no debe existir en producción.

---

## 5. Variables de entorno

```
PORT=5000

DB_HOST=
DB_PORT=5432
DB_USER=
DB_PASSWORD=
DB_NAME=cloudcinema

S3_BUCKET_NAME=
AWS_REGION=us-east-1
```

---

## 6. Cómo levantar el backend en local

```powershell
cd backend-python
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
python app.py
```

(Requiere Postgres y LocalStack corriendo vía `docker compose up -d` desde la raíz del proyecto.)

---

## 7. Cobertura de pruebas

Los 18 endpoints fueron probados manualmente con `curl`/`Invoke-RestMethod`, cubriendo camino feliz, casos de error y casos de seguridad:

- **auth:** registro exitoso/duplicado/formato inválido, login correcto/incorrecto, forgot-password exitoso/correo inexistente.
- **movies:** listar con/sin usuario, obtener por ID/inexistente, crear/duplicado, actualizar parcial, eliminar/inexistente, verificación de cascada sobre `lista_reproduccion`.
- **playlist:** agregar disponible/duplicado/próximo estreno, listar, eliminar válido/inexistente, prueba de seguridad (un usuario no puede eliminar entradas de la lista de otro).
- **profile:** obtener perfil, editar con contraseña correcta/incorrecta, sin campos, usuario inexistente.
- **uploads:** subida verificada en el bucket, rechazo de formato no permitido.