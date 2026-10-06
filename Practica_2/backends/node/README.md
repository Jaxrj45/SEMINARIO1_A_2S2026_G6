# Backend Node.js - TaskFlow + CloudDrive

Backend en **Express + TypeScript** de la Práctica 2 (Seminario 1). Implementa el mismo contrato que [`backends/python`](../python/) ([docs/contrato-api.md](../../docs/contrato-api.md)), así que el ELB y el Azure Load Balancer pueden mandar cualquier petición a cualquiera de los dos servidores.

- **Responsable:** Persona 1 (Derek)
- **Estado:** código completo, probado localmente contra PostgreSQL con los SP: `test_api.py` **17/17 OK**
- **Ejecución en producción:** PM2 (sin Docker)

## Estructura del proyecto

```
node/
├── src/
│   ├── server.ts             # Express, rutas, manejo de errores
│   ├── config/db.ts          # Pool de PostgreSQL y callSp()
│   ├── middleware/auth.ts    # JWT HS256 compatible con PyJWT
│   ├── routes/               # auth, tasks, files
│   └── utils/                # serialización y errores
├── dist/                     # JavaScript compilado (npm run build, no se sube a GitHub)
├── ecosystem.config.cjs      # Configuración de PM2
├── tsconfig.json
├── package.json
└── .env.example
```

El backend no escribe SQL: toda la lógica de datos está en los stored procedures de [`database/`](../../database/). Cada ruta llama a uno con `callSp('sp_nombre', ...)`:

| Endpoint | Stored procedure |
|---|---|
| `POST /api/auth/register` | `sp_registrar_usuario` |
| `POST /api/auth/login` | `sp_login` |
| `GET /api/tasks` | `sp_listar_tareas` |
| `POST /api/tasks` | `sp_crear_tarea` |
| `PUT /api/tasks/:id` | `sp_actualizar_tarea` |
| `PATCH /api/tasks/:id/complete` | `sp_marcar_tarea` |
| `DELETE /api/tasks/:id` | `sp_eliminar_tarea` |
| `GET /api/files` | `sp_listar_archivos` |
| `POST /api/files` | `sp_registrar_archivo` |
| `GET /api/files/:id` | `sp_obtener_archivo` |

## Tecnologías

| Componente | Uso |
|---|---|
| Express + TypeScript | API REST tipada |
| pg | Conexión a Amazon RDS PostgreSQL y llamada a los SP |
| pgcrypto (en la BD) | Contraseñas con bcrypt, encriptadas dentro del SP |
| jsonwebtoken | Autenticación sin estado (HS256), válida en cualquier servidor |
| PM2 | Mantiene el proceso vivo y lo levanta al reiniciar el servidor |

## Scripts

| Comando | Descripción |
|---|---|
| `npm run dev` | Desarrollo con recarga automática (`tsx watch`) |
| `npm run build` | Compila TypeScript a `dist/` |
| `npm start` | Ejecuta `dist/server.js` sin PM2 |
| `npm run pm2:start` | Inicia con PM2 usando `ecosystem.config.cjs` |
| `npm run pm2:restart` | Reinicia después de un `git pull` + `npm run build` |
| `npm run pm2:logs` | Muestra los logs |

## Ejecución local

Requiere Node 20+ y un PostgreSQL con los scripts de `database/` ya ejecutados.

```bash
cd Practica_2/backends/node
npm install
cp .env.example .env         # completar DB_* (DB_SSL=false en local)
npm run dev                  # http://127.0.0.1:5000/health
```

Prueba del contrato con el script de Python:

```bash
BASE_URL=http://127.0.0.1:5000 python ../python/test_api.py
```

## Despliegue con PM2 (EC2 y VM de Azure)

Resumen. El paso a paso completo desde la consola web está en [docs/persona1-despliegue.md](../../docs/persona1-despliegue.md).

```bash
cd Practica_2/backends/node
npm ci
npm run build
cp .env.example .env && nano .env    # mismos valores en EC2 y en la VM
sudo npm install -g pm2
pm2 start ecosystem.config.cjs
pm2 save
pm2 startup                           # ejecutar el comando sudo que imprime
```

## Variables de entorno

| Variable | EC2 (AWS) | VM (Azure) |
|---|---|---|
| `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` | Endpoint y credenciales de RDS | Igual |
| `DB_SSL` | `true` | `true` |
| `JWT_SECRET`, `JWT_HOURS` | Valor compartido con Python, `8` | Igual |
| `PORT` | `5000` | `5000` |

El backend no necesita credenciales de S3 ni de Blob: los archivos (incluida la foto de perfil) los suben Lambda / Azure Functions y el backend solo guarda la URL en RDS.
