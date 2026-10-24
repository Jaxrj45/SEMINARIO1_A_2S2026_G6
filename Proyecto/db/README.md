[ ← Regresar ](../README.md)

# Base de datos

| Archivo | Qué tiene |
|---|---|
| `schema.sql` | Las 7 tablas de la app |
| `seed.sql` | Datos de prueba: 4 usuarios, amistades, publicaciones, etiquetas, comentarios y mensajes |
| `docker-compose.yml` | MySQL 8 local para desarrollar sin depender de la RDS |

En la entrega la base es Amazon RDS. Cómo crearla y cargar los scripts está en [docs/configuracion-rds.md](../docs/configuracion-rds.md).

## MySQL local con Docker

Solo para desarrollar en la compu. Necesita Docker Desktop abierto.

Desde `Proyecto/db`:

```bash
docker compose up -d
```

La primera vez crea la base `semisocial` y corre `schema.sql` y `seed.sql`. Tarda unos segundos; cuando `docker compose ps` dice `healthy`, ya está lista.

Datos de conexión para el `.env` de los backends:

| Variable | Valor |
|---|---|
| `DB_HOST` | `127.0.0.1` |
| `DB_PORT` | `3307` |
| `DB_NAME` | `semisocial` |
| `DB_USER` | `semisocial` |
| `DB_PASSWORD` | `semisocial` |

Estos valores son solo para la base local. Los de la RDS son otros y se pasan por privado.

## Comandos

| Acción | Comando |
|---|---|
| Levantar | `docker compose up -d` |
| Ver si está lista | `docker compose ps` |
| Ver logs | `docker compose logs -f mysql` |
| Entrar a la consola de MySQL | `docker compose exec mysql mysql -usemisocial -psemisocial semisocial` |
| Apagar (se guardan los datos) | `docker compose down` |
| Borrar todo y volver a cargar el schema y el seed | `docker compose down -v` y luego `docker compose up -d` |

Si se cambia `schema.sql` o `seed.sql`, los cambios no se aplican solos: hay que borrar todo con `docker compose down -v` y volver a levantar.

## Puerto

La base local usa el puerto **3307** de la compu y no el 3306, para no chocar con un MySQL que ya esté instalado. Si el 3307 también está ocupado, se puede usar otro:

```bash
MYSQL_PORT=3308 docker compose up -d
```

En PowerShell:

```powershell
$env:MYSQL_PORT=3308; docker compose up -d
```

Y en el `.env` del backend se pone el mismo puerto en `DB_PORT`.
