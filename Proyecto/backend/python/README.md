[ ← Regresar ](../../README.md)

# Despliegue del backend Python

Backend en **Flask**. Corre con **gunicorn** como servicio de **systemd** en la **EC2 No. 2**. Contrato de la API: [contracts/README.md](../../contracts/README.md).

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
| Python | 3.12 (ya viene en Ubuntu 24.04) |
| Gestor de procesos | systemd (servicio `semisocial`) con gunicorn |
| Puerto | `5000` |
| Health check | `GET /api/health` |
| Base de datos | Amazon RDS MySQL con los scripts de [`db/`](../../db/) ya ejecutados |

## 2. Infraestructura en AWS (EC2)

Región: **us-east-1**. Los security groups y la RDS se crean con las guías [docs/configuracion-security-groups.md](../../docs/configuracion-security-groups.md) y [docs/configuracion-rds.md](../../docs/configuracion-rds.md).

### 2.1 Instancia

| Campo | Valor |
|---|---|
| Nombre | `ec2-python-g6` |
| AMI | Ubuntu Server 24.04 LTS |
| Tipo | `t2.micro` / `t3.micro` |
| Subnet | us-east-1b |
| IP pública | Habilitada |
| Security group | `g6-sg-backend` |
| IAM instance profile | `Semi-EC2-AppRole` (en **Advanced details**) |
| Tag | `Proyecto` = `semi` |

Con el rol `Semi-EC2-AppRole` el backend puede usar Translate y Cognito sin poner llaves de acceso en el `.env`.

Conexión: **EC2** → instancia → **Connect** → **EC2 Instance Connect**, o por SSH:

```bash
ssh -i <llave>.pem ubuntu@<IP-publica>
```

### 2.2 Load Balancer

| Recurso | Configuración |
|---|---|
| Target group `tg-semisocial-g6` | Instances, HTTP `5000`, health check `/api/health` |
| Load balancer `elb-semisocial-g6` | Internet-facing, us-east-1a y us-east-1b, `g6-sg-elb`, listener HTTP `80` → `tg-semisocial-g6` |

El balanceador de aplicación ya acepta WebSocket, así que el chat no necesita nada extra.

## 3. Instalación en el servidor

El backend queda en `~/app` (`/home/ubuntu/app`).

```bash
# Python y venv
sudo apt update
sudo apt install -y python3 python3-venv python3-pip

# Carpeta del backend
mkdir -p ~/app
```

Subir a `~/app`, por SFTP (Termius u otro cliente) o con `scp`, todo lo de `Proyecto/backend/python` menos `venv/`, `__pycache__/` y el `.env` local. Con `scp`, desde PowerShell en `Proyecto\backend\python`:

```powershell
scp -i <llave>.pem -r app.py config.py db.py requirements.txt routes services utils ubuntu@<IP-publica>:~/app/
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
├── app.py, config.py, db.py, requirements.txt
├── routes/
├── services/
├── utils/
└── venv/
```

## 4. Variables de entorno

```bash
nano ~/app/.env      # pegar el contenido de .env.example y llenarlo
chmod 600 ~/app/.env
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
| `S3_BUCKET_URL` | `https://semi1proyecto-g6.s3.amazonaws.com` |
| `PORT` | `5000` |

El `.env` es el mismo en las dos EC2 y no se sube a GitHub.

- Los valores con espacios, comillas, `#`, `$` o `\` van entre comillas dobles.
- Con gunicorn el puerto lo pone `-b 0.0.0.0:5000` en el servicio; `PORT` solo sirve con `python app.py`.

## 5. Iniciar el backend

```bash
sudo tee /etc/systemd/system/semisocial.service > /dev/null <<'EOF'
[Unit]
Description=Semi-Social Python backend
After=network.target

[Service]
User=ubuntu
WorkingDirectory=/home/ubuntu/app
EnvironmentFile=/home/ubuntu/app/.env
ExecStart=/home/ubuntu/app/venv/bin/gunicorn -w 2 -k gthread --threads 50 -b 0.0.0.0:5000 app:app
Restart=always
RestartSec=3

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload              # carga el servicio nuevo
sudo systemctl enable --now semisocial    # lo inicia y lo deja como servicio del sistema
```

Se usa `-k gthread --threads 50` porque cada conexión del chat (WebSocket) ocupa un hilo mientras está abierta. Con los workers normales de gunicorn, dos o tres chats abiertos bloquean el servidor.

Con `enable` el backend se levanta solo cuando se reinicia la instancia, y `Restart=always` lo vuelve a levantar si se cae.

## 6. Comandos de operación

| Acción | Comando |
|---|---|
| Ver estado | `systemctl status semisocial` |
| Ver logs | `sudo journalctl -u semisocial -f` |
| Últimas 100 líneas de log | `sudo journalctl -u semisocial -n 100 --no-pager` |
| Detener | `sudo systemctl stop semisocial` |
| Iniciar (si está detenido) | `sudo systemctl start semisocial` |
| Reiniciar | `sudo systemctl restart semisocial` |
| Recargar variables del `.env` | `sudo systemctl restart semisocial` |
| Recargar después de editar el `.service` | `sudo systemctl daemon-reload && sudo systemctl restart semisocial` |
| Quitar el arranque automático | `sudo systemctl disable semisocial` |
| Eliminar el servicio | `sudo systemctl disable --now semisocial && sudo rm /etc/systemd/system/semisocial.service && sudo systemctl daemon-reload` |

## 7. Actualizar después de un cambio

Volver a subir por SFTP o `scp` los archivos que cambiaron y luego:

```bash
find ~/app -name __pycache__ -type d -not -path "*/venv/*" -exec rm -rf {} +
~/app/venv/bin/pip install -r ~/app/requirements.txt
sudo systemctl restart semisocial
```

Si solo cambió el `.env`:

```bash
sudo systemctl restart semisocial
```

## 8. Verificación

gunicorn tarda un par de segundos en abrir el puerto después de iniciar o reiniciar.

```bash
curl http://127.0.0.1:5000/api/health    # {"status":"success","message":"OK","data":{"server":"python"}}
curl http://<DNS-del-ELB>/api/health     # responde node o python según a quién le toque
```

Si algo responde 500, el detalle está en `sudo journalctl -u semisocial -n 60 --no-pager`.

### Ejecución local

Para tener una base de datos en la compu, ver [db/README.md](../../db/README.md).

```bash
python -m venv venv
venv\Scripts\activate          # Linux/Mac: source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env           # con los datos de la RDS (o de un MySQL local solo para probar)
python app.py                  # http://127.0.0.1:5000/api/health
```
