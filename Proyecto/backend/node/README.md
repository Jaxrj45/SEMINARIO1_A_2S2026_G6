[ ← Regresar ](../../README.md)

# Despliegue del backend Node.js

Backend en **Express + TypeScript**. Corre con **PM2** en la **EC2 No. 1**. Contrato de la API: [contracts/README.md](../../contracts/README.md).

## Índice

1. [Requisitos](#1-requisitos)
2. [Infraestructura en AWS (EC2)](#2-infraestructura-en-aws-ec2)
3. [Instalación en el servidor](#3-instalación-en-el-servidor)
4. [Variables de entorno](#4-variables-de-entorno)
5. [Iniciar el backend](#5-iniciar-el-backend)
6. [Comandos de operación](#6-comandos-de-operación)
7. [Actualizar después de un cambio](#7-actualizar-después-de-un-cambio)
8. [Verificación](#8-verificación)

## 1. Requisitos

| Requisito | Valor |
|---|---|
| Sistema operativo | Ubuntu Server 24.04 LTS |
| Node.js | 20 o superior (se instala la 22) |
| Gestor de procesos | PM2 |
| Puerto | `5000` |
| Health check | `GET /api/health` |
| Base de datos | Amazon RDS MySQL con los scripts de [`db/`](../../db/) ya ejecutados |

## 2. Infraestructura en AWS (EC2)

Región: **us-east-1**. Los security groups y la RDS se crean con las guías [docs/configuracion-security-groups.md](../../docs/configuracion-security-groups.md) y [docs/configuracion-rds.md](../../docs/configuracion-rds.md).

### 2.1 Instancia

| Campo | Valor |
|---|---|
| Nombre | `ec2-node-g6` |
| AMI | Ubuntu Server 24.04 LTS |
| Tipo | `t2.micro` / `t3.micro` |
| Subnet | us-east-1a |
| IP pública | Habilitada |
| Security group | `g6-sg-backend` |
| IAM instance profile | `Semi-EC2-AppRole` (en **Advanced details**) |
| Tag | `Proyecto` = `semi` |

Con el rol `Semi-EC2-AppRole` el backend puede usar Translate y Cognito sin poner llaves de acceso en el `.env`.

Conexión: **EC2** → instancia → **Connect** → **EC2 Instance Connect**, o por SSH:

```bash
ssh -i g6-key.pem ubuntu@<IP-publica>
```

### 2.2 Load Balancer

Lo crea I2. La EC2 solo tiene que quedar registrada en el target group:

| Recurso | Configuración |
|---|---|
| Target group `tg-semisocial-g6` | Instances, HTTP `5000`, health check `/api/health` |
| Load balancer `elb-semisocial-g6` | Internet-facing, us-east-1a y us-east-1b, `g6-sg-elb`, listener HTTP `80` → `tg-semisocial-g6` |

## 3. Instalación en el servidor

```bash
# Node.js 22, git y PM2
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs git
sudo npm install -g pm2

# Código (repositorio privado: usar un fine-grained token con Contents: Read-only)
git clone -b <rama> https://<TOKEN>@github.com/Jaxrj45/SEMINARIO1_A_2S2026_G6.git
cd SEMINARIO1_A_2S2026_G6/Proyecto/backend/node

# Dependencias y compilación
npm ci
npm run build
```

## 4. Variables de entorno

```bash
cp .env.example .env
nano .env
```

| Variable | Valor |
|---|---|
| `DB_HOST` | Endpoint de la RDS, sin `http://` ni puerto |
| `DB_PORT` | `3306` |
| `DB_NAME` | `semisocial` |
| `DB_USER`, `DB_PASSWORD` | Usuario y contraseña de la RDS |
| `JWT_SECRET` | El mismo valor en las dos EC2 |
| `JWT_HOURS` | `8` |
| `AWS_REGION` | `us-east-1` |
| `COGNITO_USER_POOL_ID`, `COGNITO_CLIENT_ID` | Los pasa I4 |
| `UPLOAD_API` | URL del stage de API Gateway, sin `/` al final (la pasa I3) |
| `FACE_API_KEY` | API key de `/face/compare` (la pasa I3) |
| `S3_BUCKET_URL` | `https://semi1proyecto--g6.s3.amazonaws.com` |
| `PORT` | `5000` |

El `.env` es el mismo en las dos EC2 y no se sube a GitHub.

## 5. Iniciar el backend

```bash
pm2 start ecosystem.config.cjs   # inicia el proceso semisocial-node
pm2 save                         # guarda la lista de procesos
pm2 startup                      # imprime un comando "sudo env PATH=..."; copiarlo y ejecutarlo
```

Con `pm2 startup` el backend se levanta solo cuando se reinicia la instancia.

## 6. Comandos de operación

| Acción | Comando |
|---|---|
| Ver estado | `pm2 status` |
| Ver logs | `pm2 logs semisocial-node` |
| Últimas 100 líneas de log | `pm2 logs semisocial-node --lines 100` |
| Detener | `pm2 stop semisocial-node` |
| Iniciar (si está detenido) | `pm2 start semisocial-node` |
| Reiniciar | `pm2 restart semisocial-node` |
| Recargar variables del `.env` | `pm2 restart semisocial-node --update-env` |
| Eliminar de PM2 | `pm2 delete semisocial-node` |
| Quitar el arranque automático | `pm2 unstartup systemd` |

Scripts equivalentes de `package.json`: `npm run pm2:start`, `npm run pm2:restart`, `npm run pm2:logs`.

## 7. Actualizar después de un cambio

```bash
cd ~/SEMINARIO1_A_2S2026_G6/Proyecto/backend/node
git pull
npm ci
npm run build
pm2 restart semisocial-node
```

Si solo cambió el `.env`:

```bash
pm2 restart semisocial-node --update-env
```

## 8. Verificación

```bash
curl http://127.0.0.1:5000/api/health    # {"status":"success","message":"OK","data":{"server":"node"}}
curl http://<DNS-del-ELB>/api/health     # responde node o python según a quién le toque
```

Si algo responde 500, el detalle está en `pm2 logs semisocial-node --lines 100`.

### Ejecución local

Para tener una base de datos en la compu, ver [db/README.md](../../db/README.md).

```bash
npm install
cp .env.example .env    # con los datos de la RDS (o de un MySQL local solo para probar)
npm run dev             # http://127.0.0.1:5000/api/health
```
