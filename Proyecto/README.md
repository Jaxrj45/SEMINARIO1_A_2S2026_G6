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

![Arquitectura de Semi-Social](docs/img/arquitectura.png)

*Diagrama de servicios del enunciado del proyecto.*

Cómo viaja una petición:

1. El usuario abre la página desde el bucket S3 `proyecto-web-g6` (sitio web estático).
2. Las imágenes (foto de perfil y publicaciones) se suben a API Gateway, que llama a una Lambda. La Lambda guarda la imagen en el bucket `semi1proyecto-g6` y, en las publicaciones, saca las etiquetas con Rekognition.
3. El resto de peticiones van al DNS del balanceador, que las reparte entre la EC2 de Node y la de Python. Las dos tienen los mismos endpoints y guardan todo en la misma RDS MySQL.
4. Los backends usan Cognito para el registro y el login, Translate para traducir, y la Lambda `face-compare` (por API Gateway) para el login con la cara. Los permisos de AWS salen del rol de la EC2, sin llaves en el código.
5. El chatbot de Lex se usa directo desde la página con el Identity Pool de Cognito.

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

Cada integrante tiene su propio usuario IAM, solo con los servicios que le tocan, y las aplicaciones (EC2 y Lambdas) usan roles en lugar de llaves de acceso. La cuenta raíz solo se usó para crear las políticas, los roles y los usuarios. El paso a paso está en [docs/configuracion-iam.md](docs/configuracion-iam.md).

### Usuarios

| Usuario | Integrante | Políticas | Acceso |
|---|---|---|---|
| `derek` | Derek Francisco Orellana Ibáñez | `AmazonEC2FullAccess`, `AmazonRDSFullAccess`, `G6-PassRole-EC2` | Consola: EC2 No. 1, RDS y security groups |
| `jose` | José Adrian Orozco Ramírez | `AmazonEC2FullAccess`, `ElasticLoadBalancingFullAccess`, `G6-PassRole-EC2` | Consola: EC2 No. 2 y balanceador |
| `jax` | Edwin Alexander Jax Lopez | `AmazonS3FullAccess`, `AWSLambda_FullAccess`, `AmazonAPIGatewayAdministrator`, `AmazonRekognitionReadOnlyAccess` | Consola: bucket de imágenes, Lambdas, API Gateway y Rekognition |
| `miguel` | Miguel Angel Kanek Balan Velasco | `AmazonS3FullAccess`, `AmazonCognitoPowerUser`, `AmazonLexFullAccess`, `AWSLambda_FullAccess` | Consola: bucket de la página, Cognito, Lex y la Lambda del bot |

Todos tienen además `IAMUserChangePassword`, que AWS agrega para que cambien la contraseña en su primer inicio de sesión.

### Políticas propias

| Política | Permisos | La usa |
|---|---|---|
| `G6-EC2-App` | `translate:TranslateText`, `comprehend:DetectDominantLanguage`, `cognito-idp:AdminGetUser` y `cognito-idp:AdminUpdateUserAttributes` (solo en los User Pools de la cuenta) | Rol `Semi-EC2-AppRole` |
| `G6-Lambda-Imagenes` | `s3:PutObject` y `s3:GetObject` solo en `Fotos_Perfil/*` y `Fotos_Publicadas/*`; `rekognition:DetectLabels` y `rekognition:CompareFaces` | Rol `Semi-Lambda-UploadRole` |
| `G6-PassRole-EC2` | `iam:PassRole` solo sobre `Semi-EC2-AppRole`, y ver los instance profiles | Usuarios `derek` y `jose`, para asignarle el rol a las EC2 |
| `G6-Lex-Visitantes` | `lex:RecognizeText` solo sobre el alias del bot | Rol `Semi-Identity-Unauth-Role` |

### Roles

| Rol | Lo usa | Permisos |
|---|---|---|
| `Semi-EC2-AppRole` | Las dos EC2 (instance profile) | `G6-EC2-App`: traducir y leer/actualizar usuarios de Cognito |
| `Semi-Lambda-UploadRole` | Lambdas `upload-profile`, `upload-post` y `face-compare` | `AWSLambdaBasicExecutionRole` (logs en CloudWatch) y `G6-Lambda-Imagenes` |
| `Semi-LexFulfillment-Role` | Lambda `lex-facultad` del bot | `AWSLambdaBasicExecutionRole` |
| `Semi-Identity-Unauth-Role` | Visitantes de la página (Identity Pool), para hablar con Lex | `G6-Lex-Visitantes` |

## Capturas de pantalla

### IAM

Usuarios:

![Usuarios IAM](docs/img/iam-usuarios.png)

| `derek` | `jose` |
|---|---|
| ![derek](docs/img/iam-derek.png) | ![jose](docs/img/iam-jose.png) |
| **`jax`** | **`miguel`** |
| ![jax](docs/img/iam-jax.png) | ![miguel](docs/img/iam-miguel.png) |

Roles:

| `Semi-EC2-AppRole` | `Semi-Lambda-UploadRole` | `Semi-LexFulfillment-Role` |
|---|---|---|
| ![Semi-EC2-AppRole](docs/img/role-ec2-app.png) | ![Semi-Lambda-UploadRole](docs/img/role-lambda-upload.png) | ![Semi-LexFulfillment-Role](docs/img/role-lex-fulfillment.png) |

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
