[ ← Regresar ](../README.md)

# Configuración de los security groups

Todo se hace desde la consola web de AWS, en la región **us-east-1**, usando la VPC por defecto.

Las líneas que dicen **(captura)** son las que van al README final.

## Security groups

Son 3: uno para el balanceador, uno para las EC2 y uno para la RDS.

**EC2** → **Security Groups** → **Create security group**, en la VPC por defecto.

### Reglas de entrada (Inbound rules)

| Security group | Tipo | Puerto | Origen | Para qué |
|---|---|---|---|---|
| `sg-elb-g6` | HTTP | 80 | `0.0.0.0/0` | Que cualquiera pueda entrar al balanceador |
| `sg-backend-g6` | Custom TCP | 5000 | `sg-elb-g6` | Que a las EC2 solo les llegue tráfico del balanceador |
| `sg-backend-g6` | SSH | 22 | My IP | Entrar a las EC2 para instalar |
| `sg-rds-g6` | MySQL/Aurora | 3306 | `sg-backend-g6` | Que solo las EC2 lleguen a la base |
| `sg-rds-g6` | MySQL/Aurora | 3306 | My IP | Correr los scripts desde la compu |

### Reglas de salida (Outbound rules)

Se dejan como vienen (todo permitido).


## Dónde se usa cada uno

| Security group | Se asigna a |
|---|---|
| `sg-elb-g6` | El balanceador |
| `sg-backend-g6` | Las dos EC2 |
| `sg-rds-g6` | La RDS ([configuracion-rds.md](configuracion-rds.md)) |

**(captura)** Reglas de entrada de cada uno de los 3 security groups.
