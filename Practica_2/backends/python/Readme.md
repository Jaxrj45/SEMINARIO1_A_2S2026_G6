[ ← Regresar ](../../README.md)

# Despliegue del backend Python

Backend en **Flask**. Se ejecuta con **gunicorn** como servicio de **systemd** en una instancia **EC2** (AWS) y en una **VM** (Azure). Contrato de la API: [docs/contrato-api.md](../../docs/contrato-api.md).

## Índice

1. [Requisitos](#1-requisitos)
2. [Infraestructura en AWS (EC2)](#2-infraestructura-en-aws-ec2)
3. [Infraestructura en Azure (VM)](#3-infraestructura-en-azure-vm)
4. [Instalación en el servidor](#4-instalación-en-el-servidor)
5. [Variables de entorno](#5-variables-de-entorno)
6. [Servicio de systemd](#6-servicio-de-systemd)
7. [Comandos de operación](#7-comandos-de-operación)
8. [Actualizar después de un cambio](#8-actualizar-después-de-un-cambio)
9. [Verificación](#9-verificación)

## 1. Requisitos

| Requisito | Valor |
|---|---|
| Sistema operativo | Ubuntu Server 24.04 LTS |
| Python | 3.12 (incluido en Ubuntu 24.04) |
| Servidor WSGI | gunicorn |
| Puerto | `5000` |
| Health check | `GET /health` |
| Base de datos | Amazon RDS PostgreSQL con los scripts de [`database/`](../../database/) ejecutados |

## 2. Infraestructura en AWS (EC2)

Región: **us-east-1**.

### 2.1 Security groups

Se usa el mismo `sg-backend-g6` de la EC2 de Node:

| Security group | Tipo | Puerto | Origen |
|---|---|---|---|
| `sg-backend-g6` | Custom TCP | 5000 | `sg-elb-g6` |
| `sg-backend-g6` | SSH | 22 | My IP |

### 2.2 Instancia

| Campo | Valor |
|---|---|
| Nombre | `<nombre-ec2-python>` |
| AMI | Ubuntu Server 24.04 LTS |
| Tipo | `t2.micro` / `t3.micro` |
| Subnet | us-east-1b |
| IP pública | Habilitada |
| Security group | `sg-backend-g6` |

Conexión: **EC2** → instancia → **Connect** → **EC2 Instance Connect**, o por SSH:

```bash
ssh -i <llave>.pem ubuntu@<IP-publica>
```

### 2.3 Load Balancer

La instancia se registra en el target group `tg-backends-g6` (HTTP `5000`, health check `/health`) del load balancer `elb-g6`.

## 3. Infraestructura en Azure (VM)

La VM va en el **mismo grupo de recursos, región y VNet** que la VM de Node, porque el Azure Load Balancer Standard solo acepta VMs de una misma VNet.

### 3.1 VM

| Campo | Valor |
|---|---|
| Nombre | `<nombre-vm-python>` |
| Imagen | Ubuntu Server 24.04 LTS |
| Tamaño | `Standard_B1s` |
| Autenticación | SSH public key, usuario `azureuser` |
| IP pública | Nueva, SKU Standard |
| NSG | `<nombre-nsg-python>` |

### 3.2 Reglas de entrada del NSG

| Prioridad | Nombre | Puerto | Protocolo | Origen |
|---|---|---|---|---|
| 100 | `Allow-API-5000` | 5000 | TCP | Any |
| 110 | `Allow-SSH` | 22 | TCP | My IP address |

En el security group de la RDS se agrega la regla **PostgreSQL 5432** con origen `<IP-publica-de-la-VM>/32`.

Conexión:

```bash
ssh -i <llave>.pem azureuser@<IP-publica>
```

### 3.3 Load Balancer

La VM se agrega al backend pool del Azure Load Balancer, con regla al puerto `5000` y health probe HTTP en `/health`.

## 4. Instalación en el servidor

Los pasos son los mismos en la EC2 y en la VM.

```bash
# Python, venv y git
sudo apt update
sudo apt install -y python3 python3-venv python3-pip git

# Código (repositorio privado: usar un fine-grained token con Contents: Read-only)
git clone -b <rama> https://<TOKEN>@github.com/Jaxrj45/SEMINARIO1_A_2S2026_G6.git
cd SEMINARIO1_A_2S2026_G6/Practica_2/backends/python

# Entorno virtual y dependencias
python3 -m venv venv
venv/bin/pip install -r requirements.txt
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

## 6. Servicio de systemd

Crear el servicio:

```bash
sudo nano /etc/systemd/system/taskflow-python.service
```

Contenido (`<usuario>` es `ubuntu` en la EC2 y `azureuser` en la VM):

```ini
[Unit]
Description=TaskFlow backend Python (gunicorn)
After=network.target

[Service]
User=<usuario>
WorkingDirectory=/home/<usuario>/SEMINARIO1_A_2S2026_G6/Practica_2/backends/python
ExecStart=/home/<usuario>/SEMINARIO1_A_2S2026_G6/Practica_2/backends/python/venv/bin/gunicorn -w 2 -b 0.0.0.0:5000 app:app
Restart=always

[Install]
WantedBy=multi-user.target
```

Activar e iniciar:

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now taskflow-python
```

Con `enable` el backend se levanta solo al reiniciar la instancia.

## 7. Comandos de operación

| Acción | Comando |
|---|---|
| Ver estado | `sudo systemctl status taskflow-python` |
| Ver logs en vivo | `sudo journalctl -u taskflow-python -f` |
| Últimas 100 líneas de log | `sudo journalctl -u taskflow-python -n 100` |
| Detener | `sudo systemctl stop taskflow-python` |
| Iniciar | `sudo systemctl start taskflow-python` |
| Reiniciar | `sudo systemctl restart taskflow-python` |
| Quitar el arranque automático | `sudo systemctl disable taskflow-python` |
| Recargar después de editar el `.service` | `sudo systemctl daemon-reload && sudo systemctl restart taskflow-python` |

## 8. Actualizar después de un cambio

```bash
cd ~/SEMINARIO1_A_2S2026_G6/Practica_2/backends/python
git pull
venv/bin/pip install -r requirements.txt
sudo systemctl restart taskflow-python
```

Si solo cambió el `.env`:

```bash
sudo systemctl restart taskflow-python
```

## 9. Verificación

```bash
curl http://127.0.0.1:5000/health          # {"status":"ok","server":"python"}
curl http://<DNS-del-ELB>/health           # AWS
curl http://<IP-del-Azure-LB>:<puerto>/health   # Azure
```

Prueba del contrato completo:

```bash
BASE_URL=http://127.0.0.1:5000 venv/bin/python test_api.py
```

### Ejecución local

```bash
python -m venv venv
venv\Scripts\activate          # Linux/Mac: source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env           # DB_SSL=false con PostgreSQL local
python app.py                  # http://127.0.0.1:5000/health
```
