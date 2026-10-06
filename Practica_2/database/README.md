# Base de datos - TaskFlow + CloudDrive (Amazon RDS PostgreSQL)

Una sola base, `taskflow`, compartida por los 4 servidores (EC2 Node, EC2 Python, VM Node y VM Python). Los backends **no escriben SQL**: solo llaman a estos stored procedures.

## Archivos

| Archivo | Contenido |
|---|---|
| `schema.sql` | Creación de la base `taskflow`, extensión `pgcrypto` y tablas `users`, `tasks`, `files` |
| `procedimientos.sql` | Todos los stored procedures en un solo archivo (para DataGrip) |
| `sps/*.sql` | Un stored procedure por archivo (mismo contenido que `procedimientos.sql`) |

| Stored procedure | Uso |
|---|---|
| `sp_registrar_usuario` | Registro. Guarda la contraseña con bcrypt (`crypt` + `gen_salt('bf')`) |
| `sp_login` | Inicio de sesión. Compara la contraseña contra el hash |
| `sp_listar_tareas`, `sp_obtener_tarea` | Consulta de tareas del usuario |
| `sp_crear_tarea`, `sp_actualizar_tarea`, `sp_marcar_tarea`, `sp_eliminar_tarea` | CRUD de tareas |
| `sp_listar_archivos`, `sp_obtener_archivo`, `sp_registrar_archivo` | Archivos. Solo se guarda la URL de S3/Blob, nunca el archivo |

## Cómo ejecutarlo en RDS (DataGrip)

1. Crear la instancia RDS **PostgreSQL** y conectarse desde DataGrip al endpoint, puerto 5432, con SSL, a la base `postgres`.
2. En `schema.sql`, ejecutar solo `CREATE DATABASE taskflow;` (cursor sobre la sentencia + Ctrl+Enter). Omitirlo si la base ya existe.
3. Cambiar la conexión a la base `taskflow` y ejecutar el resto de `schema.sql`.
4. Ejecutar `procedimientos.sql` completo sobre `taskflow`.

Con `psql`, desde esta carpeta (después de crear la base):

```bash
psql "host=<endpoint-RDS> dbname=taskflow user=<usuario> sslmode=require" -f procedimientos.sql
```

Los scripts se pueden volver a ejecutar sin perder datos: las tablas usan `CREATE TABLE IF NOT EXISTS` y los SP `CREATE OR REPLACE FUNCTION`.
