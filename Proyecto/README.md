[ ← Regresar ](../README.md)

<div align="center">

# Semi-Social - Proyecto

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

- [Semi-Social - Proyecto](#semi-social---proyecto)
  - [Integrantes](#integrantes)
  - [Índice](#índice)
  - [Descripción de la arquitectura utilizada](#descripción-de-la-arquitectura-utilizada)
  - [Descripción de los usuarios IAM, permisos y roles](#descripción-de-los-usuarios-iam-permisos-y-roles)
    - [Usuarios](#usuarios)
    - [Roles](#roles)
  - [Capturas de pantalla](#capturas-de-pantalla)
    - [IAM](#iam)
    - [Buckets de S3](#buckets-de-s3)
    - [EC2](#ec2)
    - [Security groups](#security-groups)
    - [Load Balancer](#load-balancer)
    - [RDS](#rds)
    - [Lambda](#lambda)
    - [API Gateway](#api-gateway)
    - [Cognito](#cognito)
    - [Lex](#lex)
    - [Aplicación web](#aplicación-web)
    - [Pruebas](#pruebas)
  - [Librerías utilizadas](#librerías-utilizadas)

Documentación complementaria:

- [Contrato de la API](contracts/README.md)
- [Despliegue del backend Node.js](backend/node/README.md)
- [Despliegue del backend Python](backend/python/README.md)
- Configuración en AWS (en este orden):
  1. [IAM: políticas, roles y usuarios](docs/configuracion-iam.md)
  2. [Security groups](docs/configuracion-security-groups.md)
  3. [RDS MySQL](docs/configuracion-rds.md)
  4. [Buckets de S3](docs/configuracion-s3.md)
  5. [Balanceador](docs/configuracion-balanceador.md)
  6. [Funciones Lambda](docs/configuracion-lambda.md)
  7. [API Gateway](docs/configuracion-api-gateway.md)
  8. [Cognito](docs/configuracion-cognito.md)
  9. [Lex](docs/configuracion-lex.md)
- [Lista de tareas](TODO.md)

---

## Descripción de la arquitectura utilizada

**Semi-Social** es una red social donde los usuarios se registran, publican imágenes, comentan, chatean con sus amigos y traducen las publicaciones. Todo está desplegado en AWS.

> Pendiente: diagrama de arquitectura (I2).

| Componente | Recurso | Función |
| ---------- | ------- | ------- |
| Frontend | Bucket S3 `proyecto-web-g6` | Hospeda la página web estática |
| Backends | `ec2-node-g6` y `ec2-python-g6`, puerto 5000 | API de usuarios, amigos, publicaciones, comentarios, traducción y chat |
| Balanceador | Application Load Balancer `elb-semisocial-g6` (HTTP 80 → 5000, health check `/api/health`) | Reparte las peticiones entre Node y Python |
| Base de datos | Amazon RDS MySQL `semi-rds-g6` | Usuarios, amistades, publicaciones, etiquetas, comentarios y mensajes |
| Imágenes | Bucket S3 `semi1proyecto-g6` con `Fotos_Perfil` y `Fotos_Publicadas` | Fotos de perfil y de publicaciones |
| Subida de imágenes | API Gateway + Lambdas `upload-profile`, `upload-post` y `face-compare` | Guardan las imágenes en S3, sacan las etiquetas y comparan caras |
| Usuarios | Amazon Cognito (User Pool) | Registro, verificación por correo e inicio de sesión |
| Reconocimiento | Amazon Rekognition | Etiquetas de las imágenes y login con la cara |
| Traducción | Amazon Translate | Traduce publicaciones y comentarios |
| Chatbot | Amazon Lex | Responde preguntas sobre la facultad |

## Descripción de los usuarios IAM, permisos y roles

> Pendiente (I2).

### Usuarios

| Usuario | Integrante | Políticas | Acceso |
|---|---|---|---|
| | | | |

### Roles

| Rol | Lo usa | Permisos |
|---|---|---|
| `Semi-EC2-AppRole` | Las dos EC2 | |
| `Semi-Lambda-UploadRole` | Lambdas de subida y de login facial | |
| `Semi-LexFulfillment-Role` | Lambda del bot | |
| `Semi-Identity-Unauth-Role` | Visitantes de la página (para hablar con Lex) | |

## Capturas de pantalla

### IAM

> Pendiente (I2).

### Buckets de S3

> Pendiente: bucket de imágenes (I3) y bucket de la página web (I4).

### EC2

> Pendiente: EC2 No. 1 (I1) y EC2 No. 2 (I2).

### Security groups

> Pendiente (I1).

### Load Balancer

> Pendiente: target group, balanceador y prueba de falla (I2).

### RDS

> Pendiente (I1).

### Lambda

> Pendiente (I3).

### API Gateway

> Pendiente (I3).

### Cognito

> Pendiente (I4).

### Lex

> Pendiente (I4).

### Aplicación web

> Pendiente (I4).

### Pruebas

| Prueba | Resultado |
| ------ | --------- |
| Peticiones a `/api/health` por el balanceador | |
| Con una EC2 apagada, la app sigue funcionando | |
| Registro con verificación de correo | |
| Login con la cara | |
| Chat entre dos navegadores | |

## Librerías utilizadas

> Pendiente: lista de librerías del frontend, de los backends y de las Lambdas.
