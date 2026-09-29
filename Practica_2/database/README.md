# Base de datos - TaskFlow + CloudDrive (Amazon RDS PostgreSQL)

Una sola base, `taskflow`, compartida por los 4 servidores (EC2 Node, EC2 Python, VM Node y VM Python). Los backends **no escriben SQL**: solo llaman a estos stored procedures.

## Archivos

| Archivo | Contenido |
|---|---|
| `schema.sql` | Extensión `pgcrypto` y tablas `users`, `tasks`, `files` |
| `sps/*.sql` | Un stored procedure por función del backend |

| Stored procedure | Uso |
|---|---|
| `sp_registrar_usuario` | Registro. Guarda la contraseña con bcrypt (`crypt` + `gen_salt('bf')`) |
| `sp_login` | Inicio de sesión. Compara la contraseña contra el hash |
| `sp_listar_tareas`, `sp_obtener_tarea` | Consulta de tareas del usuario |
| `sp_crear_tarea`, `sp_actualizar_tarea`, `sp_marcar_tarea`, `sp_eliminar_tarea` | CRUD de tareas |
| `sp_listar_archivos`, `sp_obtener_archivo`, `sp_registrar_archivo` | Archivos. Solo se guarda la URL de S3/Blob, nunca el archivo |

## Cómo ejecutarlo en RDS

1. Crear la instancia RDS **PostgreSQL** y, dentro de ella, la base `taskflow`.
2. Conectarse con un cliente gráfico (pgAdmin o DBeaver) al endpoint de RDS, puerto 5432, con SSL.
3. Ejecutar `schema.sql` y luego cada archivo de `sps/`.

   Con `psql` basta un solo comando, desde esta carpeta:

   ```bash
   psql "host=<endpoint-RDS> dbname=taskflow user=<usuario> sslmode=require" -f init.sql
   ```

Los scripts se pueden volver a ejecutar sin perder datos: las tablas usan `IF NOT EXISTS` y los SP se recrean.
