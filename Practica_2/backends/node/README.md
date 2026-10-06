[ ← Regresar ](../../README.md)

# Despliegue del backend Node.js

Backend en **Express + TypeScript**. Se ejecuta con **PM2** en una instancia **EC2** (AWS) y en una **VM** (Azure). Contrato de la API: [docs/contrato-api.md](../../docs/contrato-api.md).

## Índice

1. [Requisitos](#1-requisitos)
2. [Infraestructura en AWS (EC2)](#2-infraestructura-en-aws-ec2)
3. [Infraestructura en Azure (VM)](#3-infraestructura-en-azure-vm)
4. [Instalación en el servidor](#4-instalación-en-el-servidor)
5. [Variables de entorno](#5-variables-de-entorno)
6. [Iniciar el backend](#6-iniciar-el-backend)
7. [Comandos de operación](#7-comandos-de-operación)
8. [Actualizar después de un cambio](#8-actualizar-después-de-un-cambio)
9. [Verificación](#9-verificación)

## 1. Requisitos

| Requisito | Valor |
|---|---|
| Sistema operativo | Ubuntu Server 24.04 LTS |
| Node.js | 20 o superior (se instala la 22) |
| Gestor de procesos | PM2 |
| Puerto | `5000` |
| Health check | `GET /health` |
| Base de datos | Amazon RDS PostgreSQL con los scripts de [`database/`](../../database/) ejecutados |

## 2. Infraestructura en AWS (EC2)

Región: **us-east-1**.

### 2.1 Security groups

| Security group | Tipo | Puerto | Origen |
|---|---|---|---|
| `sg-elb-g6` | HTTP | 80 | `0.0.0.0/0` |
| `sg-backend-g6` | Custom TCP | 5000 | `sg-elb-g6` |
| `sg-backend-g6` | SSH | 22 | My IP |
| SG de la RDS | PostgreSQL | 5432 | `sg-backend-g6` |

### 2.2 Instancia

| Campo | Valor |
|---|---|
| Nombre | `ec2-node-g6` |
| AMI | Ubuntu Server 24.04 LTS |
| Tipo | `t2.micro` / `t3.micro` |
| Subnet | us-east-1a |
| IP pública | Habilitada |
| Security group | `sg-backend-g6` |

Conexión: **EC2** → instancia → **Connect** → **EC2 Instance Connect**, o por SSH:

```bash
ssh -i g6-key.pem ubuntu@<IP-publica>
```

### 2.3 Load Balancer

| Recurso | Configuración |
|---|---|
| Target group `tg-backends-g6` | Instances, HTTP `5000`, health check `/health` |
| Load balancer `elb-g6` | Internet-facing, us-east-1a y us-east-1b, `sg-elb-g6`, listener HTTP `80` → `tg-backends-g6` |

## 3. Infraestructura en Azure (VM)

La VM va en el **mismo grupo de recursos, región y VNet** que la VM de Python, porque el Azure Load Balancer Standard solo acepta VMs de una misma VNet.

### 3.1 VM

| Campo | Valor |
|---|---|
| Nombre | `vm-node-g6` |
| Imagen | Ubuntu Server 24.04 LTS |
| Tamaño | `Standard_B1s` |
| Autenticación | SSH public key, usuario `azureuser` |
| IP pública | Nueva, SKU Standard |
| NSG | `nsg-node-g6` |

### 3.2 Reglas de entrada del NSG

| Prioridad | Nombre | Puerto | Protocolo | Origen |
|---|---|---|---|---|
| 100 | `Allow-API-5000` | 5000 | TCP | Any |
| 110 | `Allow-SSH` | 22 | TCP | My IP address |

En el security group de la RDS se agrega la regla **PostgreSQL 5432** con origen `<IP-publica-de-la-VM>/32`.

Conexión:

```bash
ssh -i vm-node-g6-key.pem azureuser@<IP-publica>
```

### 3.3 Load Balancer

La VM se agrega al backend pool del Azure Load Balancer, con regla al puerto `5000` y health probe HTTP en `/health`.

## 4. Instalación en el servidor

Los pasos son los mismos en la EC2 y en la VM.

```bash
# Node.js 22, git y PM2
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs git
sudo npm install -g pm2

# Código (repositorio privado: usar un fine-grained token con Contents: Read-only)
git clone -b <rama> https://<TOKEN>@github.com/Jaxrj45/SEMINARIO1_A_2S2026_G6.git
cd SEMINARIO1_A_2S2026_G6/Practica_2/backends/node

# Dependencias y compilación
npm ci
npm run build
```

## 5. Variables de entorno

```bash
cp .env.example .env
nano .env
```

| Variable | Valor |
|---|---|
| `DB_HOST` | Endpoint de RDS |
| `DB_PORT` | `5432` |
| `DB_NAME` | `taskflow` |
| `DB_USER`, `DB_PASSWORD` | Credenciales de RDS |
| `DB_SSL` | `true` |
| `JWT_SECRET` | Mismo valor en los 4 servidores |
| `JWT_HOURS` | `8` |
| `PORT` | `5000` |

El `.env` es el mismo en la EC2 y en la VM. No se sube a GitHub.

## 6. Iniciar el backend

```bash
pm2 start ecosystem.config.cjs   # inicia el proceso taskflow-node
pm2 save                         # guarda la lista de procesos
pm2 startup                      # imprime un comando "sudo env PATH=..."; copiarlo y ejecutarlo
```

Con `pm2 startup` el backend se levanta solo al reiniciar la instancia.

## 7. Comandos de operación

| Acción | Comando |
|---|---|
| Ver estado | `pm2 status` |
| Ver logs | `pm2 logs taskflow-node` |
| Últimas 100 líneas de log | `pm2 logs taskflow-node --lines 100` |
| Detener | `pm2 stop taskflow-node` |
| Iniciar (si está detenido) | `pm2 start taskflow-node` |
| Reiniciar | `pm2 restart taskflow-node` |
| Recargar variables del `.env` | `pm2 restart taskflow-node --update-env` |
| Eliminar de PM2 | `pm2 delete taskflow-node` |
| Quitar el arranque automático | `pm2 unstartup systemd` |

Scripts equivalentes de `package.json`: `npm run pm2:start`, `npm run pm2:restart`, `npm run pm2:logs`.

## 8. Actualizar después de un cambio

```bash
cd ~/SEMINARIO1_A_2S2026_G6/Practica_2/backends/node
git pull
npm ci
npm run build
pm2 restart taskflow-node
```

Si solo cambió el `.env`:

```bash
pm2 restart taskflow-node --update-env
```

## 9. Verificación

```bash
curl http://127.0.0.1:5000/health          # {"status":"ok","server":"node"}
curl http://<DNS-del-ELB>/health           # AWS
curl http://<IP-del-Azure-LB>:<puerto>/health   # Azure
```

Prueba del contrato completo (requiere Python y `requests`):

```bash
BASE_URL=http://127.0.0.1:5000 python3 ../python/test_api.py
```

### Ejecución local

```bash
npm install
cp .env.example .env    # DB_SSL=false con PostgreSQL local
npm run dev             # http://127.0.0.1:5000/health
```
