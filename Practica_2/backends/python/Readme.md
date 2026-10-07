[ ← Regresar ](../../README.md)

# Despliegue del backend Python

Backend en **Flask**. Se ejecuta con **gunicorn** como servicio de **systemd** en una instancia **EC2** (AWS) y en una **VM** (Azure). Contrato de la API: [docs/contrato-api.md](../../docs/contrato-api.md).

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
| Python | 3.12 (incluido en Ubuntu 24.04) |
| Gestor de procesos | systemd (servicio `taskflow`) con gunicorn |
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
| Nombre | `ec2-python-g6` |
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

| Recurso | Configuración |
|---|---|
| Target group `tg-backends-g6` | Instances, HTTP `5000`, health check `/health` |
| Load balancer `elb-g6` | Internet-facing, us-east-1a y us-east-1b, `sg-elb-g6`, listener HTTP `80` → `tg-backends-g6` |

## 3. Infraestructura en Azure (VM)

La VM va en el **mismo grupo de recursos, región y VNet** que la VM de Node, porque el Azure Load Balancer Standard solo acepta VMs de una misma VNet.

### 3.1 VM

| Campo | Valor |
|---|---|
| Nombre | `vm-python-g6` |
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

Los pasos son los mismos en la EC2 y en la VM. El backend queda en `~/app` (`/home/ubuntu/app` en la EC2, `/home/azureuser/app` en la VM).

```bash
# Python y venv
sudo apt update
sudo apt install -y python3 python3-venv python3-pip

# Carpeta del backend
mkdir -p ~/app
```

Subir a `~/app`, por SFTP (Termius u otro cliente) o con `scp`, estos archivos de `Practica_2/backends/python`:

```
app.py  config.py  db.py  extensions.py  requirements.txt  test_api.py  routes/  utils/
```

No se suben `venv/`, `__pycache__/` ni el `.env` local. Con `scp`, desde PowerShell en `Practica_2\backends\python`:

```powershell
scp -i <llave>.pem -r app.py config.py db.py extensions.py requirements.txt test_api.py routes utils <usuario>@<IP-publica>:~/app/
```

Entorno virtual y dependencias:

```bash
python3 -m venv ~/app/venv
~/app/venv/bin/pip install -r ~/app/requirements.txt
```

Estructura final:

```
~/app/
├── .env
├── app.py, config.py, db.py, extensions.py, requirements.txt, test_api.py
├── routes/
├── utils/
└── venv/
```

## 5. Variables de entorno

```bash
cat > ~/app/.env <<'EOF'
# ┌────────────────────────────────┐
# |  Base de datos (RDS Postgres)  |
# └────────────────────────────────┘
DB_HOST=
DB_PORT=5432
DB_NAME=taskflow
DB_USER=
DB_PASSWORD=
# RDS PostgreSQL exige SSL
DB_SSL=true

# ┌─────────────────────────────┐
# |             JWT             |
# └─────────────────────────────┘
JWT_SECRET=CAMBIAR_MISMO_VALOR_EN_TODOS_LOS_SERVIDORES
JWT_HOURS=8

# ┌─────────────────────────────┐
# |            Server           |
# └─────────────────────────────┘
PORT=5000
EOF
chmod 600 ~/app/.env
nano ~/app/.env
```

| Variable | Valor |
|---|---|
| `DB_HOST` | Endpoint de RDS, sin `http://` ni puerto |
| `DB_PORT` | `5432` |
| `DB_NAME` | `taskflow` |
| `DB_USER`, `DB_PASSWORD` | Credenciales de RDS |
| `DB_SSL` | `true` |
| `JWT_SECRET` | Mismo valor en los 4 servidores |
| `JWT_HOURS` | `8` |
| `PORT` | `5000` |

El `.env` es el mismo en la EC2 y en la VM. No se sube a GitHub.

- Si `DB_HOST` queda vacío, la conexión a la base falla con `/var/run/postgresql/.s.PGSQL.5432`.
- Los valores con espacios, comillas, `#`, `$` o `\` van entre comillas dobles.
- Con gunicorn, el puerto lo fija `-b 0.0.0.0:5000` en el servicio; `PORT` solo aplica con `python app.py`.

## 6. Iniciar el backend

Crear el servicio según el proveedor.

**AWS (EC2, usuario `ubuntu`):**

```bash
sudo tee /etc/systemd/system/taskflow.service > /dev/null <<'EOF'
[Unit]
Description=TaskFlow Python backend
After=network.target

[Service]
User=ubuntu
WorkingDirectory=/home/ubuntu/app
EnvironmentFile=/home/ubuntu/app/.env
ExecStart=/home/ubuntu/app/venv/bin/gunicorn -w 2 -b 0.0.0.0:5000 app:app
Restart=always
RestartSec=3

[Install]
WantedBy=multi-user.target
EOF
```

**Azure (VM, usuario `azureuser`):**

```bash
sudo tee /etc/systemd/system/taskflow.service > /dev/null <<'EOF'
[Unit]
Description=TaskFlow Python backend
After=network.target

[Service]
User=azureuser
WorkingDirectory=/home/azureuser/app
EnvironmentFile=/home/azureuser/app/.env
ExecStart=/home/azureuser/app/venv/bin/gunicorn -w 2 -b 0.0.0.0:5000 app:app
Restart=always
RestartSec=3

[Install]
WantedBy=multi-user.target
EOF
```

En ambos casos:

```bash
sudo systemctl daemon-reload            # carga el servicio nuevo
sudo systemctl enable --now taskflow    # lo inicia y lo deja como servicio del sistema
```

Con `enable` el backend se levanta solo al reiniciar la instancia, y `Restart=always` lo vuelve a levantar si se cae.

## 7. Comandos de operación

| Acción | Comando |
|---|---|
| Ver estado | `systemctl status taskflow` |
| Ver logs | `sudo journalctl -u taskflow -f` |
| Últimas 100 líneas de log | `sudo journalctl -u taskflow -n 100 --no-pager` |
| Detener | `sudo systemctl stop taskflow` |
| Iniciar (si está detenido) | `sudo systemctl start taskflow` |
| Reiniciar | `sudo systemctl restart taskflow` |
| Recargar variables del `.env` | `sudo systemctl restart taskflow` |
| Recargar después de editar el `.service` | `sudo systemctl daemon-reload && sudo systemctl restart taskflow` |
| Quitar el arranque automático | `sudo systemctl disable taskflow` |
| Eliminar el servicio | `sudo systemctl disable --now taskflow && sudo rm /etc/systemd/system/taskflow.service && sudo systemctl daemon-reload` |

## 8. Actualizar después de un cambio

Volver a subir por SFTP o `scp` los archivos que cambiaron (reemplazando los existentes) y luego:

```bash
find ~/app -name __pycache__ -type d -not -path "*/venv/*" -exec rm -rf {} +
~/app/venv/bin/pip install -r ~/app/requirements.txt
sudo systemctl restart taskflow
```

Si solo cambió el `.env`:

```bash
sudo systemctl restart taskflow
```

## 9. Verificación

gunicorn tarda un par de segundos en abrir el puerto después de iniciar o reiniciar.

```bash
curl http://127.0.0.1:5000/health          # {"server":"python","status":"ok"}
curl http://<DNS-del-ELB>/health           # AWS
curl http://<IP-del-Azure-LB>:<puerto>/health   # Azure
```

Prueba del contrato completo:

```bash
BASE_URL=http://127.0.0.1:5000 ~/app/venv/bin/python ~/app/test_api.py
```

Si registro o login responden 500, el detalle está en `sudo journalctl -u taskflow -n 60 --no-pager`.

### Ejecución local

```bash
python -m venv venv
venv\Scripts\activate          # Linux/Mac: source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env           # DB_SSL=false con PostgreSQL local
python app.py                  # http://127.0.0.1:5000/health
```
