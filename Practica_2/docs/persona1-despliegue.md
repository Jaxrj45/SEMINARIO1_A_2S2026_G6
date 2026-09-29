# Persona 1 (Derek): guía de despliegue desde la consola web

Todo se hace desde la **consola web de AWS** y el **portal de Azure**. Los únicos comandos son los que se escriben *dentro* del servidor para instalar Node.js y levantar el backend con **PM2**, usando la terminal del navegador (EC2 Instance Connect o Azure Cloud Shell).

Las líneas **Capturas:** y las marcas **(captura)** indican qué capturar para la sección del README final.

## Día 1: entregables para el grupo

- [ ] Compartir [contrato-api.md](contrato-api.md). La sección 6 dice qué le toca a cada quien.
- [ ] Crear los usuarios IAM por servicio (sección 1) y entregar las credenciales por privado (nunca en el repo).
- [ ] Definir un `JWT_SECRET` (cualquier cadena larga y aleatoria) y pasárselo a Persona 2 por privado.

---

## 1. IAM: un usuario por servicio

Cada usuario tiene **solo las políticas de su servicio**, como pide el enunciado. Los servicios que en AWS pertenecen a la misma consola comparten usuario: el Load Balancer y los security groups son parte de **EC2**, así que los maneja `g6-ec2`.

| Usuario | Servicio | Políticas administradas | Lo usa |
|---|---|---|---|
| `g6-ec2` | EC2: instancias, security groups (incluido el de RDS), Load Balancer | `AmazonEC2FullAccess`, `ElasticLoadBalancingFullAccess` | Persona 1, Persona 2 |
| `g6-rds` | RDS | `AmazonRDSFullAccess` | Persona 3 |
| `g6-s3` | S3 | `AmazonS3FullAccess` | Persona 3 |
| `g6-lambda` | Lambda | `AWSLambda_FullAccess` | Persona 4 |
| `g6-apigateway` | API Gateway | `AmazonAPIGatewayAdministrator` | Persona 4 |
| `g6-app-s3` | S3, solo acceso programático | `G6-App-S3-Archivos` (política propia) | Los backends Node y Python (`.env`) |

Notas:
- El security group de la RDS es un recurso de EC2. Por eso la regla del puerto 5432 la agrega `g6-ec2` y no `g6-rds`.
- `AmazonEC2FullAccess` ya incluye `elasticloadbalancing:*`. `ElasticLoadBalancingFullAccess` se adjunta igual para que en la captura se vea explícito que el usuario administra el balanceador.

### 1.1 Crear los usuarios de consola

1. Consola de AWS → **IAM** → **Users** → **Create user**.
2. *User name*: `g6-ec2`.
3. Marcar **Provide user access to the AWS Management Console** → **I want to create an IAM user**.
4. *Console password*: **Custom password**. Dejar marcado **Users must create a new password at next sign-in**. → **Next**.
5. *Permissions options*: **Attach policies directly**. Buscar y marcar las políticas del usuario según la tabla. → **Next** → **Create user**.
6. **Download .csv file**: trae la URL de inicio de sesión, el usuario y la contraseña. Entregárselo por privado a quien lo use.
7. Repetir con `g6-rds`, `g6-s3`, `g6-lambda` y `g6-apigateway`.

**Capturas:** Lista de usuarios · Pestaña *Permissions* de cada usuario

### 1.2 Crear el usuario de los backends (`g6-app-s3`)

Los servidores solo necesitan subir archivos al bucket. Por eso este usuario no tiene consola y su única política es escribir en el bucket de archivos.

1. **IAM** → **Policies** → **Create policy** → pestaña **JSON**. Pegar lo siguiente, cambiando el nombre del bucket por el que cree Persona 3:

   ```json
   {
     "Version": "2012-10-17",
     "Statement": [
       {
         "Sid": "BackendSubeArchivos",
         "Effect": "Allow",
         "Action": ["s3:PutObject", "s3:GetObject"],
         "Resource": "arn:aws:s3:::practica2semi1a2s2026archivosg6/*"
       }
     ]
   }
   ```

2. **Next**. *Policy name*: `G6-App-S3-Archivos` → **Create policy**.
3. **Users** → **Create user**. *User name*: `g6-app-s3`. **No** marcar el acceso a consola. → **Next**.
4. **Attach policies directly** → buscar y marcar `G6-App-S3-Archivos` → **Next** → **Create user**.
5. Entrar al usuario → pestaña **Security credentials** → **Create access key** → *Use case*: **Other** → **Next** → **Create access key**.
6. **Download .csv file**. Ese `AWS_ACCESS_KEY_ID` y `AWS_SECRET_ACCESS_KEY` van en el `.env` de las EC2 y las VM. Pasárselos a Persona 2 por privado.

**Capturas:** Política JSON `G6-App-S3-Archivos` · Usuario `g6-app-s3` sin acceso a consola

---

## 2. EC2 del backend Node (AWS)

Inicia sesión con `g6-ec2`. Todo va en la región **us-east-1 (N. Virginia)**.

### 2.1 Security groups

1. **EC2** → **Network & Security** → **Security Groups** → **Create security group**.
2. Crear `sg-elb-g6` (*Description*: "Balanceador G6", VPC por defecto):
   - *Inbound rules* → **Add rule**: Type **HTTP**, Port 80, Source **Anywhere-IPv4** (`0.0.0.0/0`).
   - **Create security group**.
3. Crear `sg-backend-g6` (*Description*: "Backends G6"):
   - Regla 1: Type **Custom TCP**, Port **5000**, Source **Custom** → elegir `sg-elb-g6` en la lista. Así solo el balanceador llega al backend.
   - Regla 2: Type **SSH**, Port 22, Source **My IP**.
   - **Create security group**.
4. Cuando Persona 3 cree la RDS, abrir su security group (lo hace `g6-ec2`):
   - Security group de la RDS → **Edit inbound rules** → **Add rule**: Type **PostgreSQL** (5432), Source **Custom** → `sg-backend-g6`.

Persona 2 usa este mismo `sg-backend-g6` para la EC2 de Python.

**Capturas:** Reglas de entrada de `sg-backend-g6`, `sg-elb-g6` y del SG de la RDS

### 2.2 Lanzar la instancia

1. **EC2** → **Instances** → **Launch instances**.
2. *Name*: `ec2-node-g6`.
3. *Application and OS Images*: **Ubuntu Server 24.04 LTS**.
4. *Instance type*: `t2.micro` (o `t3.micro`).
5. *Key pair*: **Create new key pair** → `g6-key`, formato `.pem`. Se descarga una sola vez: guardarla.
6. *Network settings* → **Edit**:
   - *Subnet*: la que termina en **us-east-1a**.
   - *Auto-assign public IP*: **Enable**.
   - *Firewall*: **Select existing security group** → `sg-backend-g6`.
7. **Launch instance**.

**Capturas:** Instancia en estado *Running* con su detalle

### 2.3 Instalar y levantar el backend con PM2

1. Seleccionar la instancia → **Connect** → pestaña **EC2 Instance Connect** → **Connect**. Se abre una terminal en el navegador.

   Instance Connect entra por el puerto 22. Si la regla SSH está en *My IP* y la conexión falla, agrega temporalmente la regla SSH con origen el prefix list `com.amazonaws.us-east-1.ec2-instance-connect`.

2. Instalar Node.js 22, git y PM2:

   ```bash
   curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
   sudo apt install -y nodejs git
   sudo npm install -g pm2
   ```

3. Descargar el repositorio y compilar. Como el repo es privado, se usa un token de GitHub: GitHub → Settings → Developer settings → **Fine-grained tokens**, con permiso *Contents: Read-only* sobre este repo. `<rama>` es la rama con el código final (por ejemplo `develop`).

   ```bash
   git clone -b <rama> https://<TOKEN>@github.com/Jaxrj45/SEMINARIO1_A_2S2026_G6.git
   cd SEMINARIO1_A_2S2026_G6/Practica_2/backends/node
   npm ci
   npm run build
   cp .env.example .env
   nano .env
   ```

4. Completar el `.env` (guardar con `Ctrl+O`, `Enter`, `Ctrl+X`):

   ```
   DB_HOST=<endpoint-de-RDS>
   DB_PORT=5432
   DB_NAME=taskflow
   DB_USER=<usuario de RDS>
   DB_PASSWORD=<clave de RDS>
   DB_SSL=true
   JWT_SECRET=<el valor compartido>
   STORAGE_PROVIDER=aws
   S3_BUCKET=<bucket de archivos>
   AWS_REGION=us-east-1
   AWS_ACCESS_KEY_ID=<de g6-app-s3>
   AWS_SECRET_ACCESS_KEY=<de g6-app-s3>
   PORT=5000
   ```

5. Levantar con PM2 y dejarlo como servicio del sistema:

   ```bash
   pm2 start ecosystem.config.cjs
   pm2 save
   pm2 startup          # imprime un comando "sudo env PATH=... pm2 startup systemd ..."; copiarlo y ejecutarlo
   curl http://127.0.0.1:5000/health        # {"status":"ok","server":"node"}
   ```

   Comandos útiles: `pm2 status`, `pm2 logs taskflow-node`. Para actualizar el código: `git pull && npm ci && npm run build && pm2 restart taskflow-node`.

**Capturas:** `pm2 status` con `taskflow-node` *online* · Salida de `curl /health`

---

## 3. Load Balancer (ELB)

Sigue con el usuario `g6-ec2`. Antes de empezar, la EC2 de Python (Persona 2) tiene que estar corriendo en una subnet de **us-east-1b** con `sg-backend-g6`.

### 3.1 Target group

1. **EC2** → **Load Balancing** → **Target Groups** → **Create target group**.
2. *Target type*: **Instances**. *Name*: `tg-backends-g6`. *Protocol*: HTTP, *Port*: **5000**. VPC por defecto.
3. *Health checks*: Protocol HTTP, *Path*: **/health**.
4. **Advanced health check settings**: *Healthy threshold* **2**, *Unhealthy threshold* **2**, *Interval* **10** s. Así una falla se detecta en unos 20 segundos.
5. **Next** → marcar `ec2-node-g6` y la EC2 de Python → **Include as pending below** → **Create target group**.

### 3.2 Application Load Balancer

1. **Load Balancers** → **Create load balancer** → **Application Load Balancer** → **Create**.
2. *Name*: `elb-g6`. *Scheme*: **Internet-facing**. *IP address type*: IPv4.
3. *Network mapping*: marcar **us-east-1a** y **us-east-1b**.
4. *Security groups*: quitar el default y elegir `sg-elb-g6`.
5. *Listeners and routing*: HTTP : 80 → *Default action* **Forward to** `tg-backends-g6`.
6. **Create load balancer**. Tarda 2 o 3 minutos en quedar *Active*.
7. En **Target Groups** → `tg-backends-g6` → pestaña **Targets**, esperar a que los dos estén **healthy**.
8. Copiar el **DNS name** del ELB y pasárselo a Persona 3 para el build del frontend.

**Capturas:** Detalle del ELB (DNS, AZs, estado Active) · Listener · Target group con 2 targets *healthy*

---

## 4. Prueba de falla (AWS)

1. En el navegador, abrir `http://<DNS-del-ELB>/health` y recargar varias veces. La respuesta alterna entre `"server":"node"` y `"server":"python"`. **(captura de cada una)**
2. **EC2** → **Instances** → `ec2-node-g6` → **Instance state** → **Stop instance**.
3. **Target Groups** → `tg-backends-g6` → **Targets**: esperar a que el target de Node quede *unhealthy* o *unused*. **(captura)**
4. Recargar `http://<DNS-del-ELB>/health`: ahora siempre responde `python`, sin errores. **(captura)**
5. Abrir el frontend desde el bucket S3, iniciar sesión, crear una tarea y ver los archivos. La app sigue funcionando. **(captura)**
6. **Instance state** → **Start instance**. PM2 levanta el backend solo gracias a `pm2 startup`. Confirmar que el target vuelve a *healthy*.

Al reiniciar la instancia su IP pública cambia. No afecta al ELB porque registra la instancia por su ID.

---

## 5. VM del backend Node (Azure)

Usa el **mismo grupo de recursos, región y VNet** que la VM de Python de Persona 2. El Azure Load Balancer Standard solo acepta en su pool VMs de una misma VNet.

### 5.1 Crear la VM

1. Portal de Azure → **Virtual machines** → **Create** → **Azure virtual machine**.
2. Pestaña **Basics**:
   - *Resource group*: el de Persona 2.
   - *Virtual machine name*: `vm-node-g6`. *Region*: la misma que la VM de Python.
   - *Image*: **Ubuntu Server 24.04 LTS**. *Size*: **Standard_B1s**.
   - *Authentication type*: **SSH public key**. *Username*: `azureuser`. *Key pair name*: `vm-node-g6-key`.
   - *Public inbound ports*: **None**. Las reglas se definen en el paso siguiente.
3. Pestaña **Networking**:
   - *Virtual network* y *Subnet*: las mismas de la VM de Python.
   - *Public IP*: crear una nueva (SKU Standard).
   - *NIC network security group*: **Advanced** → **Create new** `nsg-node-g6` con estas reglas de entrada:

     | Prioridad | Nombre | Puerto | Protocolo | Origen | Acción |
     |---|---|---|---|---|---|
     | 100 | `Allow-API-5000` | 5000 | TCP | Any | Allow |
     | 110 | `Allow-SSH` | 22 | TCP | *My IP address* | Allow |

     El puerto 5000 queda abierto a *Any* porque el Load Balancer Standard conserva la IP del cliente. Si el origen fuera solo `AzureLoadBalancer`, pasarían los health probes pero no el tráfico real.

4. **Review + create** → **Create** → **Download private key and create resource**.

**Capturas:** VM *Running* · Reglas de entrada de `nsg-node-g6`

### 5.2 Instalar y levantar el backend con PM2

1. En la VM → **Connect** → **SSH**. También sirve **Cloud Shell** (icono `>_` arriba en el portal): subir ahí la llave con *Manage files → Upload* y ejecutar `ssh -i vm-node-g6-key.pem azureuser@<IP-publica>`.
2. Los mismos comandos del paso 2.3 (Node.js, PM2, `git clone`, `npm ci`, `npm run build`, `.env`, `pm2 start`, `pm2 save`, `pm2 startup`). En el `.env` de Azure cambian estas líneas:

   ```
   STORAGE_PROVIDER=azure
   AZURE_STORAGE_CONNECTION_STRING=<Storage account → Security + networking → Access keys → Connection string>
   AZURE_STORAGE_CONTAINER=<contenedor de archivos creado por Persona 3>
   ```

   Las líneas de S3 pueden quedar vacías.

3. `curl http://127.0.0.1:5000/health` debe responder `{"status":"ok","server":"node"}`.
4. Con `g6-ec2`, agregar en el security group de la RDS la regla **PostgreSQL 5432** con origen `<IP-publica-de-la-VM>/32`. La RDS tiene que estar en *Publicly accessible: Yes* (lo configura Persona 3).
5. Avisar a Persona 2 que `vm-node-g6` está lista para agregarla al backend pool del Azure Load Balancer (puerto 5000, probe HTTP en `/health`).

**Capturas:** `pm2 status` y salida de `curl /health` en la VM

---

## Checklist de la rúbrica

- [ ] Contrato de API compartido
- [ ] Backend Node (TypeScript) probado contra el contrato (`test_api.py` 17/17)
- [ ] Usuarios IAM por servicio y credenciales entregadas
- [ ] EC2 Node con SG mínimo (5000 solo desde el ELB, 22 desde tu IP) y PM2 como servicio
- [ ] SG de RDS abierto al 5432 solo desde `sg-backend-g6` y las IP de las VM
- [ ] ELB con los 2 targets *healthy*
- [ ] Prueba de falla en AWS con capturas
- [ ] VM Node en Azure con NSG mínimo y PM2 como servicio
- [ ] Sección del README con capturas entregada a Persona 4
