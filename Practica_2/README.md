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

1. [Descripción de la arquitectura utilizada](#descripción-de-la-arquitectura-utilizada)
2. [Descripción de los usuarios IAM y sus políticas](#descripción-de-los-usuarios-iam-y-sus-políticas)
3. [Capturas de pantalla de todos los recursos AWS y Azure](#capturas-de-pantalla-de-todos-los-recursos-aws-y-azure)
   - [AWS](#aws)
   - [Azure](#azure)
4. [Conclusiones sobre las diferencias percibidas entre Azure y AWS](#conclusiones-sobre-las-diferencias-percibidas-entre-azure-y-aws)

Documentación complementaria:

- [Contrato de la API](docs/contrato-api.md)
- [Despliegue del backend Node.js](backends/node/README.md)
- [Despliegue del backend Python](backends/python/Readme.md)

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

### AWS

### Azure

## Descripción de los usuarios IAM y sus políticas

### Usuarios

| Usuario | Integrante | Políticas | Acceso |
|---|---|---|---|
| `d3r3k` | Derek Francisco Orellana Ibáñez | `AmazonEC2FullAccess`, `ElasticLoadBalancingFullAccess` | Consola |
| `jax` | Edwin Alexander Jax Lopez | `AmazonEC2FullAccess` | Consola |
| `miguel` | Miguel Angel Kanek Balan Velasco | `AmazonS3FullAccess`, `AmazonRDSFullAccess`, `AmazonEC2FullAccess` | Consola |
| `jose` | José Adrian Orozco Ramírez | `AWSLambda_FullAccess`, `AmazonAPIGatewayAdministrator`, `AmazonS3FullAccess` | Consola |

### Política `G6-S3-Archivos`

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
| `G6-S3-Archivos` | Escritura y lectura en el bucket de archivos |

## Capturas de pantalla de todos los recursos AWS y Azure

### AWS

#### IAM

#### S3

#### EC2

#### Load Balancer

#### RDS

#### Lambda

#### API Gateway

### Azure

#### Azure VM

#### Azure Blob Storage

#### Azure Load Balancer

#### Azure Functions

#### Azure API Management

## Conclusiones sobre las diferencias percibidas entre Azure y AWS
