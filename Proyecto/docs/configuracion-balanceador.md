[ ← Regresar ](../README.md)

# Configuración del balanceador

Todo se hace desde la consola web de AWS, en la región **us-east-1**, en la sección **EC2**. Antes hay que tener:

- Las dos EC2 creadas y respondiendo `/api/health` en el puerto 5000 ([backend/node/README.md](../backend/node/README.md) y [backend/python/README.md](../backend/python/README.md)).
- Los security groups `sg-elb-g6` y `sg-backend-g6` ([configuracion-security-groups.md](configuracion-security-groups.md)).

Las líneas que dicen **(captura)** son las que van al README final.

## Índice

1. [Target group](#1-target-group)
2. [Load balancer](#2-load-balancer)
3. [Probar el balanceo](#3-probar-el-balanceo)
4. [Prueba de falla](#4-prueba-de-falla)

## 1. Target group

El target group es la lista de instancias a las que el balanceador les reparte el tráfico.

**EC2** → **Target Groups** → **Create target group**.

| Campo | Valor |
|---|---|
| Target type | Instances |
| Target group name | `tg-semisocial-g6` |
| Protocol / Port | HTTP / `5000` |
| VPC | La VPC por defecto |
| Health check protocol | HTTP |
| Health check path | `/api/health` |

En **Advanced health check settings**, para que detecte más rápido cuando una EC2 se cae:

| Campo | Valor |
|---|---|
| Healthy threshold | 2 |
| Unhealthy threshold | 2 |
| Timeout | 5 segundos |
| Interval | 10 segundos |
| Success codes | 200 |

**Next** → marcar `ec2-node-g6` y `ec2-python-g6`, puerto `5000` → **Include as pending below** → **Create target group**.

Después, en el target group → **Attributes** → **Edit**:

| Campo | Valor |
|---|---|
| Deregistration delay | 30 segundos (por defecto son 300 y la prueba de falla tarda mucho) |
| Stickiness | Apagado, para que alterne entre Node y Python |

## 2. Load balancer

**EC2** → **Load Balancers** → **Create load balancer** → **Application Load Balancer** → **Create**.

| Campo | Valor |
|---|---|
| Load balancer name | `elb-semisocial-g6` |
| Scheme | Internet-facing |
| IP address type | IPv4 |
| VPC | La VPC por defecto |
| Mappings | `us-east-1a` y `us-east-1b` (tienen que estar las zonas donde están las EC2) |
| Security groups | Quitar `default` y dejar solo `sg-elb-g6` |
| Listener | HTTP : 80 → Forward to `tg-semisocial-g6` |

**Create load balancer**. Tarda unos minutos en pasar de **Provisioning** a **Active**.

El **DNS name** del balanceador es la URL que usa el frontend como `API_BASE`, con `http://` adelante. El chat (WebSocket) funciona por ese mismo DNS sin configurar nada más.

**(captura)** El balanceador en estado Active con su DNS name y el listener.

## 3. Probar el balanceo

En el target group → **Targets**, las dos instancias tienen que estar en **healthy**. Si alguna sale **unhealthy**, revisar que:

- el backend esté corriendo (`pm2 status` o `systemctl status semisocial`);
- responda en la instancia: `curl http://127.0.0.1:5000/api/health`;
- `sg-backend-g6` deje entrar el puerto 5000 desde `sg-elb-g6`.

Después, desde la compu (en Git Bash):

```bash
for i in $(seq 1 10); do curl -s http://<DNS-del-balanceador>/api/health; echo; done
```

Tienen que salir respuestas con `"server":"node"` y con `"server":"python"` mezcladas.

**(captura)** Target group con las dos instancias en healthy y el resultado del comando.

## 4. Prueba de falla

1. **EC2** → **Instances** → seleccionar `ec2-node-g6` → **Instance state** → **Stop instance**.
2. Esperar a que en el target group salga **unhealthy** o **unused** (unos 20 a 30 segundos).
3. Repetir el comando del paso anterior: ahora todas las respuestas tienen que ser `"server":"python"`, y la página tiene que seguir funcionando.
4. Volver a encender `ec2-node-g6` y esperar a que salga **healthy**.
5. Repetir con `ec2-python-g6`.

Al encender de nuevo una EC2, el backend se levanta solo (PM2 o systemd). La IP pública puede cambiar, pero eso no afecta al balanceador.

**(captura)** Cada paso: las dos encendidas, una apagada con la app funcionando, y otra vez las dos encendidas.
