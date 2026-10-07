[ ← Regresar ](../README.md)

<div align="center">

# TaskFlow + CloudDrive - Practica 2

**Seminario de Sistemas 1**

Facultad de Ingeniería · Ingeniería en Ciencias y Sistemas

Universidad de San Carlos de Guatemala · Segundo Semestre 2026

</div>

## Integrantes

|   #   | Nombre                           |   Carné   |
| :---: | -------------------------------- | :-------: |
|   1   | Edwin Alexander Jax Lopez        | 202200338 |
|   2   | Derek Francisco Orellana Ibáñez  | 202001151 |
|   3   | Miguel Angel Kanek Balan Velasco | 202300765 |
|   4   | José Adrian Orozco Ramírez       | 202210908 |

## Índice

- [TaskFlow + CloudDrive - Practica 2](#taskflow--clouddrive---practica-2)
  - [Integrantes](#integrantes)
  - [Índice](#índice)
  - [Descripción de la arquitectura utilizada](#descripción-de-la-arquitectura-utilizada)
    - [AWS](#aws)
    - [Azure](#azure)
  - [Descripción de los usuarios IAM y sus políticas](#descripción-de-los-usuarios-iam-y-sus-políticas)
    - [Usuarios](#usuarios)
    - [Política `G6-App-S3-Archivos`](#política-g6-app-s3-archivos)
    - [Rol `g6-lambda-role`](#rol-g6-lambda-role)
    - [Azure: usuarios de Entra ID y roles RBAC](#azure-usuarios-de-entra-id-y-roles-rbac)
  - [Capturas de pantalla de todos los recursos AWS y Azure](#capturas-de-pantalla-de-todos-los-recursos-aws-y-azure)
    - [AWS](#aws-1)
      - [IAM](#iam)
      - [S3](#s3)
      - [EC2](#ec2)
      - [Load Balancer](#load-balancer)
      - [RDS](#rds)
      - [Lambda](#lambda)
      - [API Gateway](#api-gateway)
    - [Azure](#azure-1)
      - [Azure VM](#azure-vm)
      - [Azure Blob Storage](#azure-blob-storage)
      - [Azure Load Balancer](#azure-load-balancer)
      - [Azure Functions](#azure-functions)
      - [Azure API Management](#azure-api-management)
    - [Pruebas](#pruebas)
  - [Conclusiones sobre las diferencias percibidas entre Azure y AWS](#conclusiones-sobre-las-diferencias-percibidas-entre-azure-y-aws)

Documentación complementaria:

- [Contrato de la API](docs/contrato-api.md)
- [Despliegue del backend Node.js](backends/node/README.md)
- [Despliegue del backend Python](backends/python/Readme.md)
- [Funciones serverless (AWS Lambda y Azure Functions)](serverless/README.md)

---

## Descripción de la arquitectura utilizada

**TaskFlow + CloudDrive** es una aplicación web para la gestión de tareas y el almacenamiento de archivos, desplegada en AWS y en Microsoft Azure con servicios equivalentes.

| Capa | AWS | Azure |
|---|---|---|
| Frontend estático | Amazon S3 | Azure Blob Storage |
| Balanceador de carga | Elastic Load Balancer | Azure Load Balancer |
| Backend (Node.js y Python) | 2 instancias EC2 | 2 Azure VM |
| Serverless | AWS Lambda + Amazon API Gateway | Azure Functions + Azure API Management |
| Archivos de usuarios | Amazon S3 | Azure Blob Storage |
| Base de datos | Amazon RDS (PostgreSQL) | Amazon RDS (PostgreSQL) |

Hay dos backends con las mismas funciones (Node.js y Python) detrás de un balanceador en cada nube. Una única base de datos RDS la comparten todos los servidores, de modo que un usuario registrado en un servidor existe en los demás.

**Sesión sin estado.** El balanceador alterna las peticiones entre los dos backends, por lo que la autenticación no depende del servidor: token JWT HS256 firmado con el mismo secreto en todos, claims `sub`, `username` y `exp`, y contraseñas con bcrypt. El contrato completo está en [`docs/contrato-api.md`](docs/contrato-api.md).

**Dos formas de subir archivos.**

- **Modo A:** el frontend envía el archivo al backend y este lo guarda en S3 o en Blob.
- **Modo B (serverless):** el frontend envía el archivo a API Gateway o API Management, la función lo guarda y devuelve `{ url, name, type }`. Después el frontend registra esa URL en el backend con `POST /api/files`. Detalle en [`serverless/README.md`](serverless/README.md).

### AWS

![Arquitectura AWS](docs/img/arquitectura-aws.png)

| Componente | Recurso | Función |
| ---------- | ------- | ------- |
| Frontend | Bucket S3 `practica2semi1a2s2026paginawebg6` | Hospeda la web estática |
| Backends | `ec2-node-g6` y `ec2-python-g6`, puerto 5000 | API de tareas, usuarios y archivos |
| Balanceador | Application Load Balancer `elb-g6` (HTTP 80 → 5000, health check `/health`) | Reparte entre Node y Python |
| Base de datos | Amazon RDS PostgreSQL | Usuarios, tareas y archivos (solo la URL) |
| Archivos | Bucket S3 `practica2semi1a2s2026archivosg6` | Imágenes y textos, lectura pública |
| Serverless | API Gateway `g6-serverless-api` + Lambdas `g6-subir-imagen` y `g6-subir-texto` | Subida directa desde el frontend |

### Azure

![Arquitectura Azure](docs/img/arquitectura-azure.png)

| Componente | Recurso | Función |
| ---------- | ------- | ------- |
| Frontend | Azure Blob Storage | Hospeda la web estática |
| Backends | `vm-node-g6` y `vm-python-g6` en `vnet-taskflow-g6`, puerto 5000 | API de tareas, usuarios y archivos |
| Balanceador | Azure Load Balancer (sonda HTTP `/health`) | Reparte entre Node y Python |
| Base de datos | La misma RDS de AWS | Misma información en ambas nubes |
| Archivos | Contenedor `practica2semi1a2s2026archivosg6` en la cuenta `taskflowstorageg6` | Imágenes y textos, lectura pública |
| Serverless | API Management `g6-apim` + Function App `g6-azure-functions` | Subida directa desde el frontend |

## Descripción de los usuarios IAM y sus políticas

### Usuarios

| Usuario | Integrante | Políticas | Acceso |
|---|---|---|---|
| `d3r3k` | Derek Francisco Orellana Ibáñez | `AmazonEC2FullAccess`, `ElasticLoadBalancingFullAccess` | Consola |
| `jax` | Edwin Alexander Jax Lopez | `AmazonEC2FullAccess` | Consola |
| `miguel` | Miguel Angel Kanek Balan Velasco | `AmazonS3FullAccess`, `AmazonRDSFullAccess`, `AmazonEC2FullAccess` | Consola |
| `jose` | José Adrian Orozco Ramírez | `AWSLambda_FullAccess`, `AmazonAPIGatewayAdministrator`, `AmazonS3FullAccess` | Consola |
| `g6-backend-s3` | Los backends de las EC2 | `G6-App-S3-Archivos` | Solo llaves de acceso |

### Política `G6-App-S3-Archivos`

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": ["s3:PutObject", "s3:GetObject"],
      "Resource": "arn:aws:s3:::practica2semi1a2s2026archivosg6/*"
    }
  ]
}
```

### Rol `g6-lambda-role`

| Política | Uso |
|---|---|
| `AWSLambdaBasicExecutionRole` | Logs en CloudWatch |
| `G6-App-S3-Archivos` | Escritura y lectura en el bucket de archivos |

Lo asumen las dos Lambdas al ejecutarse. Es distinto de un usuario IAM porque lo usa el servicio y no una persona.

### Azure: usuarios de Entra ID y roles RBAC

Equivalente a los usuarios IAM: un usuario por servicio, con permisos limitados al grupo de recursos `rg-taskflow-g6`.

| Usuario | Rol RBAC | Servicio |
|---|---|---|
| `taskflow-vm-g6` | Virtual Machine Contributor | Máquinas virtuales |
| `taskflow-red-g6` | Network Contributor | VNet, NSG y Load Balancer |
| `taskflow-storage-g6` | Storage Account Contributor, Storage Blob Data Contributor | Blob Storage |
| `taskflow-serverless-g6` | Website Contributor, API Management Service Contributor | Functions y API Management |

![Usuarios de Entra ID](docs/img/azure-entra-usuarios.png)

![Roles del grupo de recursos](docs/img/azure-rbac-roles.png)

## Capturas de pantalla de todos los recursos AWS y Azure

### AWS

#### IAM

![Usuarios IAM](docs/img/derek/image.png)
![Usuario IAM](docs/img/aws-iam-usuario.png)
![Política G6-App-S3-Archivos](docs/img/derek/image-1.png)
![Rol G6-Lambda-Role](docs/img/derek/image-2.png)

#### S3

Bucket de archivos con acceso público de lectura:

![S3 de archivos](serverless/capturas/aws-s3-archivos-permisos.png)

Bucket del frontend (`practica2semi1a2s2026paginawebg6`) configurado con Alojamiento de sitios web estáticos y políticas públicas:
![S3 Frontend](docs/img/aws-bucket.png)

**URL Pública (AWS):** `http://practica2semi1a2s2026paginawebg6.s3-website-us-east-1.amazonaws.com/`

#### EC2

![EC2 Python](docs/img/aws-ec2-python.png)

![Security Group de la EC2 Python](docs/img/aws-sg-ec2-python.png)

El backend corre como servicio del sistema (systemd) y se reinicia solo:

![Servicio del backend en la EC2](docs/img/aws-ec2-systemd.png)

![Reinicio de la EC2 sin reinicios del servicio](docs/img/aws-ec2-reinicio.png)

Pruebas de la API (`test_api.py`) contra la EC2:

![test_api contra la EC2](docs/img/aws-ec2-test-api.png)

![Node VM](docs/img/derek/image-3.png)

#### Load Balancer

![Target Group](docs/img/derek/image-4.png)
![ELB](docs/img/derek/image-5.png)
![DNS de ELB](docs/img/derek/image-6.png)

#### RDS

> **Pendiente:** instancia RDS y su security group (Miguel).

#### Lambda

![Funciones Lambda](serverless/capturas/aws-lambda-funciones.png)

![Variable de entorno de g6-subir-texto](serverless/capturas/aws-lambda-texto-variables.png)

![Variable de entorno de g6-subir-imagen](serverless/capturas/aws-lambda-imagen-variables.png)

#### API Gateway

![Rutas](serverless/capturas/aws-apigw-rutas-finales.png)

![Integraciones](serverless/capturas/aws-apigw-integraciones.png)

![CORS](serverless/capturas/aws-apigw-cors.png)

![Stage e Invoke URL](serverless/capturas/aws-apigw-stage.png)

### Azure

#### Azure VM

![Grupo de recursos](docs/img/azure-resource-group.png)

![Red virtual](docs/img/azure-vnet.png)

![Subred](docs/img/azure-subredes.png)

![Reglas del NSG](docs/img/azure-nsg-reglas.png)

![VM Python en ejecución](docs/img/azure-vm-python.png)

![Servicio del backend (systemd)](docs/img/azure-vm-systemd.png)

![Servicio del backend activo y /health](docs/img/azure-vm-health.png)

Pruebas de la API (`test_api.py`) contra la VM:

![test_api contra la VM](docs/img/azure-vm-test-api.png)

![test_api contra la VM, segunda ejecución](docs/img/azure-vm-test-api-2.png)

![Node Azure en ejecucion](docs/img/derek/image-7.png)

#### Azure Blob Storage

Cuenta de almacenamiento `taskflowstorageg6` configurada con el contenedor público `practica2semi1a2s2026archivosg6` y el contenedor `$web` para el despliegue del Frontend estático:
![Azure Blob Storage y Sitio Estático](docs/img/azure-bucket.png)

**URL Pública (Azure):** `http://taskflowstorageg6.z13.web.core.windows.net/`

#### Azure Load Balancer

Peticiones a `/health` por el balanceador: responden los dos backends.

![Balanceo entre los dos backends](docs/img/prueba-balanceo.png)

Prueba de falla: se detiene `vm-python-g6` desde el portal y el balanceador sigue respondiendo solo con `node`.

![VM Python detenida](docs/img/azure-vm-python-detenida.png)

![Prueba de falla](docs/img/prueba-falla.png)

> **Pendiente:** pool de backend, sonda de salud y regla de balanceo del recurso (Edwin).

#### Azure Functions

![Function App y sus funciones](serverless/capturas/azure-function-app.png)

![App settings (cadena de conexión oculta)](serverless/capturas/azure-app-settings.png)

#### Azure API Management

![Instancia de APIM](serverless/capturas/azure-apim-overview.png)

![API con las dos operaciones](serverless/capturas/azure-apim-api.png)

![Política CORS](serverless/capturas/azure-apim-cors.png)

### Pruebas

| Prueba | Resultado |
| ------ | --------- |
| Registro en el servidor de Azure y login en el de AWS con el mismo usuario; el token de Azure se acepta en AWS | La base de datos es compartida y el secreto JWT es el mismo |
| 20 peticiones a `/health` por el Azure Load Balancer | Responden ambos servidores (`python` 11, `node` 9) |
| Con `vm-python-g6` detenida, 20 peticiones a `/health` | Responde solo el servidor activo (`node` 20) |
| Subida de texto e imagen por las 4 rutas serverless | `201` con la URL del archivo |

![Base de datos compartida](docs/img/prueba-cruzada-bd-compartida.png)

![Rutas serverless de AWS y Azure](serverless/capturas/pruebas-4-rutas.png)

## Conclusiones sobre las diferencias percibidas entre Azure y AWS

- **Identidad.** En AWS se crea un usuario IAM y se le adjuntan políticas administradas, y las funciones necesitan además un rol de ejecución aparte. En Azure se crean usuarios en Entra ID y se les asigna un rol RBAC con alcance a un grupo de recursos, que ordena todo en una sola unidad y permite borrarlo de una vez al terminar.
- **Serverless.** En AWS bastó con pegar el código en la Lambda y crear un API HTTP con dos rutas. En Azure la función se despliega desde VS Code y se necesita además API Management para tener rutas y CORS, que fue la pieza que más tardó en configurarse.
- **Cuotas y suscripción de prueba.** La cuenta gratuita de Azure no permite el plan Flex Consumption y tenía cuota cero del plan Consumption en East US y East US 2, por lo que la Function App y APIM quedaron en Central US. En AWS no encontramos restricciones de este tipo.
- **Red.** Los Security Groups de AWS y los NSG de Azure cumplen el mismo papel. En Azure el balanceador solo acepta máquinas de una misma red virtual, lo que obligó a que todas vivieran en `vnet-taskflow-g6`.
- **Costos.** Las máquinas virtuales de Azure cobran por hora mientras están asignadas, y apagarlas desde dentro del sistema no detiene el cobro. En AWS, `t3.micro` entra en la capa gratuita, y Lambda y API Gateway casi no tienen costo para este uso.
- **Consola.** La consola de AWS es más directa para crear recursos sueltos. El portal de Azure agrupa mejor por grupo de recursos, pero tiene más pasos y más errores de validación al crear servicios.
