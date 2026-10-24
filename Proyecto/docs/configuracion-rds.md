[ ← Regresar ](../README.md)

# Configuración de la RDS MySQL

Todo se hace desde la consola web de AWS, en la región **us-east-1**, usando la VPC por defecto. Antes hay que tener el security group `g6-sg-rds` ([configuracion-security-groups.md](configuracion-security-groups.md)).

Las líneas que dicen **(captura)** son las que van al README final.

## Índice

1. [Crear la RDS](#1-crear-la-rds)
2. [Correr los scripts de la base](#2-correr-los-scripts-de-la-base)

## 1. Crear la RDS

**RDS** → **Databases** → **Create database**.

| Campo | Valor |
|---|---|
| Creation method | Standard create |
| Engine | MySQL |
| Engine version | La última **8.4.x**. La 8.0 ya no tiene soporte normal en RDS y pide "Extended Support", que cobra aparte |
| Template | Free tier |
| Deployment | Single-AZ (una sola instancia) |
| DB instance identifier | `semi-rds-g6` |
| Master username | El que se acuerde en el grupo |
| Credentials management | **Self managed** (con Secrets Manager cobra aparte) |
| Master password | Una contraseña segura, se pasa por privado y nunca va en el repo |
| Instance class | `db.t3.micro` o `db.t4g.micro` |
| Storage | 20 GB, sin autoscaling |
| Compute resource | **Don't connect to an EC2 compute resource** (si no, crea security groups por su cuenta) |
| VPC | La VPC por defecto |
| DB subnet group | El que venga por defecto |
| Public access | Yes (para poder correr los scripts desde la compu) |
| Security group | Choose existing: quitar `default` y dejar solo `g6-sg-rds` |
| Database port | `3306` |
| Monitoring | Dejar lo básico; desactivar **Enhanced Monitoring** y **Performance Insights** si aparecen |
| Initial database name | `semisocial` (en **Additional configuration**) |
| Backups | Se pueden desactivar para que se cree más rápido |
| Deletion protection | Desactivado, para poder borrarla al terminar el curso |

Tarda unos 5 a 10 minutos. Cuando el estado esté en **Available**, el endpoint aparece en la pestaña **Connectivity & security**.

Que la RDS sea pública no significa que cualquiera pueda entrar: el security group solo deja pasar a las EC2 y a la IP de quien corre los scripts.

**(captura)** La RDS en estado Available y la pestaña Connectivity & security.

## 2. Correr los scripts de la base

Desde la compu, con MySQL Workbench o con el cliente `mysql`, en la carpeta `Proyecto/db`:

```bash
mysql -h <endpoint-de-la-rds> -u <usuario> -p semisocial < schema.sql
mysql -h <endpoint-de-la-rds> -u <usuario> -p semisocial < seed.sql
```

Para revisar que se crearon las tablas:

```bash
mysql -h <endpoint-de-la-rds> -u <usuario> -p semisocial -e "SHOW TABLES;"
```

La RDS ya viene en UTC, así que no hay que cambiar la zona horaria.

Los datos de conexión van en el `.env` de cada backend, como se explica en su README.

**(captura)** Resultado de `SHOW TABLES;` con las 7 tablas.
