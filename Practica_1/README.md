# CloudCinema — Seminario de Sistemas 1

## Integrantes
| Nombre | Carné | Rol |
|---|---|---|
| _(A)_ | | DevOps / Cloud Infrastructure Lead |
| _(B)_ | | Backend Node.js Lead |
| _(C)_ | | Backend Python Lead / DB Specialist |
| _(D)_ | | Frontend & Integration Lead |

## Estructura del repositorio

```
CloudCinema-G#/
├── backend-node/        → API en Node.js/Express (Integrante B)
├── backend-python/       → API en Python/Flask o FastAPI (Integrante C)
├── frontend/              → Sitio estático (Integrante D)
├── docs/                  → Diagramas y capturas para este README (todos)
└── README.md              → Este archivo (documentación técnica final)
```

> Cada carpeta es **independiente**: cada integrante trabaja únicamente
> dentro de la suya para evitar sobreescrituras. Nadie edita código
> dentro de la carpeta de otro sin avisar/hacer PR.

## Flujo de trabajo en Git (para no pisarse)

1. **Nunca se hace `push` directo a `main`.** `main` solo recibe código
   ya probado vía Pull Request.
2. Cada integrante trabaja en su propia rama, con el prefijo de su
   carpeta:
   - `feature/backend-node-auth`
   - `feature/backend-python-rds`
   - `feature/frontend-galeria`
   - `feature/infra-alb`
3. Flujo básico:
   ```bash
   git checkout main
   git pull origin main
   git checkout -b feature/backend-node-auth
   # ... trabajar, hacer commits pequeños y descriptivos ...
   git push origin feature/backend-node-auth
   # Abrir Pull Request en GitHub -> pedir review a 1 compañero -> merge
   ```
4. Antes de empezar a trabajar cada día: `git pull origin main` para
   traer lo último y evitar conflictos grandes.
5. Como cada quien vive en su propia carpeta (`backend-node/`,
   `backend-python/`, `frontend/`), los conflictos de merge deberían
   ser casi nulos. El único archivo compartido es este `README.md` —
   edítenlo en secciones separadas y avisen en el chat del grupo antes
   de tocarlo.
6. Colaborador obligatorio: agregar a **marckomatic** (auxiliar, sección B)
   como colaborador del repo privado.

## Contrato de Endpoints (Node.js y Python responden igual)

Ambos backends exponen **exactamente** los mismos paths, los mismos codigos
de estado y el mismo JSON. Todo acceso a datos pasa por los procedimientos
almacenados de `database/sps/`.

| Metodo | Endpoint | SP que usa | Descripcion |
|---|---|---|---|
| GET | `/health` | — | Estado del nodo (`{status, server}`) |
| GET | `/auth/check-email?correo=` | `sp_existe_correo` | Valida si un correo ya esta registrado |
| POST | `/auth/register` | `sp_registrar_usuario` | Registro (correo, nombre_completo, password, password_confirm, foto_perfil) |
| POST | `/auth/login` | `sp_login` | Autenticacion (correo, password) |
| POST | `/auth/forgot-password` | `sp_recuperar_password` | Reset de contrasena por correo |
| GET | `/auth/obtenerUsuarios` | `sp_listar_usuarios` | Listado de usuarios registrados |
| GET | `/movies?id_usuario=` | `sp_listar_peliculas` | Cartelera (con `id_usuario` agrega `en_mi_lista`) |
| GET | `/movies/:id` | `sp_obtener_pelicula` | Detalle de una pelicula |
| POST | `/movies` | `sp_crear_pelicula` | Alta de pelicula |
| PUT | `/movies/:id` | `sp_actualizar_pelicula` | Edicion (los campos ausentes se conservan) |
| DELETE | `/movies/:id` | `sp_eliminar_pelicula` | Baja de pelicula |
| POST | `/playlist` | `sp_agregar_a_lista` | Agregar pelicula a "mi lista" |
| GET | `/playlist?id_usuario=` | `sp_listar_mi_lista` | Lista de reproduccion del usuario |
| DELETE | `/playlist/:id_lista?id_usuario=` | `sp_quitar_de_lista` | Eliminar pelicula de la lista |
| GET | `/profile/:id_usuario` | `sp_obtener_perfil` | Datos del perfil |
| PUT | `/profile` | `sp_actualizar_perfil` | Editar nombre/foto (requiere password actual) |
| POST | `/uploads/profile-photo` | — | Sube una imagen a S3 y devuelve `{key, url}` |

### Notas del contrato

- **Imagenes**: `/auth/register` y `PUT /profile` aceptan `application/json`
  (con `foto_perfil` = key ya subida via `/uploads/profile-photo`) o
  `multipart/form-data` (con `foto_perfil` = archivo, que el backend sube a S3).
  Las respuestas siempre devuelven la URL publica completa.
- **`POST /playlist` es idempotente**: si la pelicula ya estaba en la lista
  responde `200` con `ya_estaba: true`; si se agrego responde `201`.
- **Errores**: los ERRCODE de los SPs se mapean igual en ambos backends —
  `unique_violation` → 409, `no_data_found` → 404, `check_violation` → 400,
  `invalid_password` → 401.
- **Fechas**: siempre ISO-8601 UTC con milisegundos (`2026-08-28T10:00:00.000Z`).
- **IDs**: siempre numeros JSON, nunca strings.

> Si Node.js y Python no exponen exactamente los mismos paths y
> formatos de respuesta, el Load Balancer rompera la app al hacer
> failover entre instancias.

## Documentación técnica (a completar por Integrante D antes de entregar)

- [ ] Diagrama de arquitectura AWS
- [ ] Descripción de usuarios/políticas IAM
- [ ] Diagrama entidad-relación de la base de datos
- [ ] Capturas: Buckets S3, EC2 (ambas instancias), RDS, App Web funcionando
- [ ] Evidencia de prueba de failover del Load Balancer

## Variables de entorno

Cada backend trae su propio `.env.example`. Copien ese archivo a `.env`
(el cual NUNCA se sube a git — ya está en `.gitignore`) y llenen sus
credenciales reales de AWS/RDS ahí.
