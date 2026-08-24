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

## Contrato de Endpoints (Node.js y Python deben responder igual)

| Método | Endpoint | Descripción |
|---|---|---|
| POST | `/register` | Registro (correo, nombre, password, password_confirm, foto) |
| POST | `/login` | Autenticación (correo, password) |
| GET | `/movies` | Listado de la cartelera |
| POST | `/playlist` | Agregar película a "mi lista" |
| GET | `/playlist` | Obtener lista de reproducción del usuario |
| DELETE | `/playlist/:id` | Eliminar película de la lista |
| PUT | `/profile` | Editar nombre/foto (requiere password actual) |

> ⚠️ Si Node.js y Python no exponen exactamente los mismos paths y
> formatos de respuesta, el Load Balancer romperá la app al hacer
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
