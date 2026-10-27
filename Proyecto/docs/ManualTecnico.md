[ Regresar ](../README.md)

<div align="center">
<img src="img/image.png" width="150" alt="Logo Universidad" />

# Manual Técnico - Semi-Social

**Seminario de Sistemas 1**

Facultad de Ingeniería – Ingeniería en Ciencias y Sistemas

Universidad de San Carlos de Guatemala – Segundo Semestre 2026
</div>

## Integrantes

|   #   | Nombre                           |   Carné   |
| :---: | -------------------------------- | :-------: |
|   1   | Edwin Alexander Jax Lopez        | 202200338 |
|   2   | Derek Francisco Orellana Ibáñez  | 202001151 |
|   3   | Miguel Angel Kanek Balan Velasco | 202300765 |
|   4   | José Adrian Orozco Ramírez       | 202210908 |

---

## Índice

- [1. Descripción de la arquitectura utilizada](#1-descripción-de-la-arquitectura-utilizada)
  - [1.1 Flujo de datos general](#11-flujo-de-datos-general)
  - [1.2 Tabla de componentes y servicios AWS](#12-tabla-de-componentes-y-servicios-aws)
- [2. Configuración de IAM: Usuarios, Políticas y Roles](#2-configuración-de-iam-usuarios-políticas-y-roles)
  - [2.1 Usuarios IAM](#21-usuarios-iam)
  - [2.2 Políticas administradas y personalizadas](#22-políticas-administradas-y-personalizadas)
  - [2.3 Roles de servicio](#23-roles-de-servicio)
- [3. Almacenamiento en Amazon S3](#3-almacenamiento-en-amazon-s3)
  - [3.1 Bucket de imágenes `semi1proyecto--g6`](#31-bucket-de-imágenes-semi1proyecto--g6)
  - [3.2 Bucket de hosting web `proyecto-web--g6`](#32-bucket-de-hosting-web-proyecto-web--g6)
- [4. Capa de Cómputo, Red y Balanceo](#4-capa-de-cómputo-red-y-balanceo)
  - [4.1 Security Groups](#41-security-groups)
  - [4.2 Instancias EC2 (`ec2-node-g6` y `ec2-python-g6`)](#42-instancias-ec2-ec2-node-g6-y-ec2-python-g6)
  - [4.3 Application Load Balancer `elb-semisocial-g6`](#43-application-load-balancer-elb-semisocial-g6)
  - [4.4 Prueba de tolerancia a fallos](#44-prueba-de-tolerancia-a-fallos)
- [5. Base de Datos: Amazon RDS MySQL](#5-base-de-datos-amazon-rds-mysql)
  - [5.1 Parámetros de conexión y motor](#51-parámetros-de-conexión-y-motor)
  - [5.2 Modelo relacional y tablas](#52-modelo-relacional-y-tablas)
- [6. Módulo Serverless: API Gateway y AWS Lambda](#6-módulo-serverless-api-gateway-y-aws-lambda)
  - [6.1 Funciones Lambda de procesamiento multimedia](#61-funciones-lambda-de-procesamiento-multimedia)
  - [6.2 API Gateway REST `semi-api`](#62-api-gateway-rest-semi-api)
- [7. Inteligencia Artificial y Machine Learning](#7-inteligencia-artificial-y-machine-learning)
  - [7.1 Amazon Rekognition (Etiquetado y Comparación Facial)](#71-amazon-rekognition-etiquetado-y-comparación-facial)
  - [7.2 Amazon Translate y Amazon Comprehend (Traducción en tiempo real)](#72-amazon-translate-y-amazon-comprehend-traducción-en-tiempo-real)
- [8. Autenticación y Asistencia Virtual](#8-autenticación-y-asistencia-virtual)
  - [8.1 Amazon Cognito User Pool `semisocial-web`](#81-amazon-cognito-user-pool-semisocial-web)
  - [8.2 Amazon Lex V2 Bot `semi-facultad-bot` y Lambda `lex-facultad`](#82-amazon-lex-v2-bot-semi-facultad-bot-y-lambda-lex-facultad)
  - [8.3 Amazon Cognito Identity Pool `semisocial_identity_pool`](#83-amazon-cognito-identity-pool-semisocial_identity_pool)
- [9. Aplicación Web Frontend](#9-aplicación-web-frontend)
  - [9.1 Arquitectura de la interfaz](#91-arquitectura-de-la-interfaz)
  - [9.2 Módulo de Chat con WebSockets](#92-módulo-de-chat-con-websockets)
  - [9.3 Integración del bot de asistencia](#93-integración-del-bot-de-asistencia)
- [10. Evidencias de Configuración y Funcionamiento](#10-evidencias-de-configuración-y-funcionamiento)
- [11. Librerías y Tecnologías Utilizadas](#11-librerías-y-tecnologías-utilizadas)
- [12. Conclusiones](#12-conclusiones)

---

## 1. Descripción de la arquitectura utilizada

**Semi-Social** es una plataforma de red social académica orientada a la comunidad de la Facultad de Ingeniería de la Universidad de San Carlos de Guatemala. El sistema permite el registro de usuarios con validación facial y por correo electrónico, publicación de imágenes con detección automática de etiquetas, comentarios interactivos con traducción instantánea a cuatro idiomas, mensajería en tiempo real vía WebSockets y un bot conversacional para resolver dudas sobre trámites, ubicaciones y horarios.

Toda la infraestructura se encuentra alojada en **Amazon Web Services (AWS)** en la región `us-east-1` (Norte de Virginia), estructurada mediante un modelo híbrido que combina arquitectura orientada a servicios (SOA) en máquinas virtuales con una capa serverless y microservicios gestionados de inteligencia artificial.

![Arquitectura de Semi-Social](img/arquitectura.png)

### 1.1 Flujo de datos general

1. **Acceso web estático:** El cliente carga la Single-Page Application (SPA) construida en React alojada en el bucket S3 `proyecto-web--g6`, configurado con static website hosting.
2. **Subida multimedia (Serverless):** Cuando el cliente registra su fotografía de perfil o crea una nueva publicación con imagen, el archivo viaja codificado en Base64 directamente hacia Amazon API Gateway (`semi-api`), el cual invoca de manera síncrona las funciones AWS Lambda (`semi-upload-profile` y `semi-upload-post`).
3. **Almacenamiento seguro:** La Lambda almacena el archivo en el bucket S3 `semi1proyecto--g6` bajo las carpetas `Fotos_Perfil/` o `Fotos_Publicadas/` con claves únicas (UUID), extrayendo etiquetas descriptivas a través de Amazon Rekognition.
4. **Peticiones transaccionales y de negocio:** Las operaciones transaccionales (autenticación, gestión de amistades, persistencia de publicaciones, comentarios y chat) se envían al Application Load Balancer (`elb-semisocial-g6`), el cual distribuye la carga mediante round-robin entre dos instancias EC2: `ec2-node-g6` (Node.js/Express) y `ec2-python-g6` (Python/Flask).
5. **Persistencia relacional unificada:** Ambas instancias EC2 se conectan de manera simultánea a una única base de datos gestionada en Amazon RDS MySQL (`semi-rds-g6`), garantizando consistencia absoluta en el estado de la aplicación.
6. **Autenticación dual:** Los usuarios pueden iniciar sesión mediante credenciales de Amazon Cognito (validando claims y tokens JWT firmados) o mediante reconocimiento biométrico facial comparando la captura web con la foto de perfil en S3 a través de Rekognition.
7. **Traducción automática:** El backend aprovecha las llamadas internas a Amazon Translate y Amazon Comprehend utilizando el rol asignado a la EC2 sin requerir credenciales estáticas en código.
8. **Asistente conversacional Lex:** La página web interactúa directamente con Amazon Lex V2 (`semi-facultad-bot`) usando credenciales no autenticadas provistas por un Identity Pool de Cognito, procesando el cumplimiento de intenciones con la función Lambda `lex-facultad`.

### 1.2 Tabla de componentes y servicios AWS

| Capa | Servicio AWS | Recurso / Identificador | Función principal |
|---|---|---|---|
| **Hosting Web** | Amazon S3 | `proyecto-web--g6` | Hospeda los archivos estáticos de la aplicación React (`index.html`, bundle JS, CSS). |
| **Balanceo** | Application Load Balancer (ALB) | `elb-semisocial-g6` | Distribuye el tráfico HTTP entrante en el puerto 80 hacia el puerto 5000 de los servidores EC2. |
| **Servidores Backend** | Amazon EC2 | `ec2-node-g6` (us-east-1c)<br>`ec2-python-g6` (us-east-1b) | Backends redundantes e idénticos en funcionalidad desarrollados en Node.js y Python. |
| **Base de Datos** | Amazon RDS MySQL | `semi-rds-g6` (MySQL 8.0) | Almacenamiento relacional de usuarios, amistades, publicaciones, etiquetas, comentarios y chats. |
| **Almacenamiento Multimedia** | Amazon S3 | `semi1proyecto--g6` | Bucket privado de subida con lectura pública controlada para `Fotos_Perfil/` y `Fotos_Publicadas/`. |
| **API Serverless** | Amazon API Gateway | `semi-api` (REST API regional) | Expone los endpoints serverless `/upload/profile`, `/upload/post` y `/face/compare`. |
| **Computación Serverless** | AWS Lambda | `semi-upload-profile`<br>`semi-upload-post`<br>`semi-face-compare`<br>`lex-facultad` | Procesamiento de imágenes en Base64, integración con Rekognition y fulfillment de chatbot. |
| **Visión Artificial** | Amazon Rekognition | DetectLabels & CompareFaces | Detección de etiquetas en publicaciones y comparación facial biométrica para el inicio de sesión. |
| **Traducción** | Amazon Translate & Comprehend | TranslateText & DetectDominantLanguage | Detección de idioma y traducción de descripciones y comentarios a inglés, francés y portugués. |
| **Gestión de Identidades** | Amazon Cognito | User Pool `semisocial-web`<br>Identity Pool `semisocial_identity_pool` | Directorio de usuarios, verificación de correos y delegación de permisos para Amazon Lex. |
| **Chatbot Inteligente** | Amazon Lex V2 | `semi-facultad-bot` (Alias `produccion`) | Asistente virtual para resolver dudas frecuentes de los estudiantes sobre la Facultad. |

---

## 2. Configuración de IAM: Usuarios, Políticas y Roles

Para garantizar el principio de mínimo privilegio exigido en el diseño de arquitecturas seguras en la nube, se establecieron políticas granulares, usuarios dedicados para cada miembro del equipo y roles asumibles por los servicios de cómputo, prescindiendo del uso de llaves de acceso estáticas en los servidores.

### 2.1 Usuarios IAM

| Usuario | Miembro del Grupo | Carné | Políticas Asignadas | Alcance de Responsabilidad |
|---|---|---|---|---|
| `derek` | Derek Francisco Orellana Ibáñez | 202001151 | `AmazonEC2FullAccess`<br>`AmazonRDSFullAccess`<br>`G6-PassRole-EC2` | Administración de EC2 No. 1 (Node.js), base de datos RDS MySQL y grupos de seguridad. |
| `jose` | José Adrian Orozco Ramírez | 202210908 | `AmazonEC2FullAccess`<br>`ElasticLoadBalancingFullAccess`<br>`G6-PassRole-EC2` | Administración de EC2 No. 2 (Python), balanceador ALB y target groups. |
| `jax` | Edwin Alexander Jax Lopez | 202200338 | `AmazonS3FullAccess`<br>`AWSLambda_FullAccess`<br>`AmazonAPIGatewayAdministrator`<br>`AmazonRekognitionReadOnlyAccess` | Bucket de imágenes `semi1proyecto--g6`, Lambdas de subida, API Gateway y Rekognition. |
| `miguel` | Miguel Angel Kanek Balan Velasco | 202300765 | `AmazonS3FullAccess`<br>`AmazonCognitoPowerUser`<br>`AmazonLexFullAccess`<br>`AWSLambda_FullAccess` | Bucket de hosting `proyecto-web--g6`, Cognito User Pool, Identity Pool, Lex V2 y Lambda del bot. |

### 2.2 Políticas administradas y personalizadas

Se construyeron políticas JSON específicas para limitar los accesos a los recursos exactos del proyecto:

1. **`Semi-Lambda-Upload-Policy`:** Permite a las Lambdas de subida escribir y leer exclusivamente en las dos carpetas autorizadas de S3, además de invocar Rekognition:
   ```json
   {
     "Version": "2012-10-17",
     "Statement": [
       {
         "Sid": "AccesoS3Carpetas",
         "Effect": "Allow",
         "Action": ["s3:PutObject", "s3:GetObject"],
         "Resource": [
           "arn:aws:s3:::semi1proyecto--g6/Fotos_Perfil/*",
           "arn:aws:s3:::semi1proyecto--g6/Fotos_Publicadas/*"
         ]
       },
       {
         "Sid": "RekognitionServicios",
         "Effect": "Allow",
         "Action": [
           "rekognition:DetectLabels",
           "rekognition:CompareFaces"
         ],
         "Resource": "*"
       }
     ]
   }
   ```
2. **`G6-EC2-App`:** Permite a los servidores backend en EC2 ejecutar traducciones en Amazon Translate, detectar lenguaje en Amazon Comprehend y sincronizar perfiles en Cognito sin almacenar credenciales en disco:
   - Acciones: `translate:TranslateText`, `comprehend:DetectDominantLanguage`, `cognito-idp:AdminGetUser`, `cognito-idp:AdminUpdateUserAttributes`.
3. **`G6-PassRole-EC2`:** Faculta a los usuarios `derek` y `jose` a asignar el rol `Semi-EC2-AppRole` a las instancias EC2 sin otorgar privilegios de elevación de roles globales.
4. **`G6-Lex-Visitantes`:** Habilita exclusivamente la acción `lex:RecognizeText` sobre el alias de producción del bot de Lex para los visitantes de la página web.

### 2.3 Roles de servicio

| Nombre del Rol | Servicio Principal (Trust Relationship) | Políticas Adjuntas | Propósito |
|---|---|---|---|
| `Semi-EC2-AppRole` | `ec2.amazonaws.com` | `G6-EC2-App`<br>`TranslateFullAccess`<br>`ComprehendFullAccess` | Asignado como Instance Profile a las instancias EC2 para traducción y consultas a Cognito. |
| `Semi-Lambda-Upload-Role` | `lambda.amazonaws.com` | `AWSLambdaBasicExecutionRole`<br>`Semi-Lambda-Upload-Policy` | Asignado a `semi-upload-profile`, `semi-upload-post` y `semi-face-compare`. |
| `Semi-LexFulfillment-Role` | `lambda.amazonaws.com` | `AWSLambdaBasicExecutionRole` | Asignado a la Lambda `lex-facultad` para generar logs en Amazon CloudWatch. |
| `Semi-Identity-Unauth-Role` | `cognito-identity.amazonaws.com` | `G6-Lex-Visitantes` | Asignado al Identity Pool para permitir comunicación pública anónima con Amazon Lex. |

---

## 3. Almacenamiento en Amazon S3

El almacenamiento no estructurado se distribuyó en dos buckets independientes con finalidades operativas distintas:

### 3.1 Bucket de imágenes `semi1proyecto--g6`

- **Propósito:** Almacén persistente de fotografías de perfil y fotos publicadas en el muro.
- **Configuración:** Región `us-east-1`, ACLs deshabilitadas (recomendado por AWS), cifrado SSE-S3 por defecto.
- **Estructura de carpetas:**
  - `Fotos_Perfil/`: Imágenes cuadradas de rostros de los usuarios.
  - `Fotos_Publicadas/`: Fotografías adjuntas a los posts del feed.
- **Seguridad y Control de Acceso:** Se desmarcó la opción *Block all public access* para permitir lectura pública de los archivos individuales mediante la siguiente política de bucket, garantizando que nadie pueda listar el bucket (`s3:ListBucket`) ni escribir directamente:
  ```json
  {
    "Version": "2012-10-17",
    "Statement": [
      {
        "Sid": "LecturaPublicaFotos",
        "Effect": "Allow",
        "Principal": "*",
        "Action": "s3:GetObject",
        "Resource": [
          "arn:aws:s3:::semi1proyecto--g6/Fotos_Perfil/*",
          "arn:aws:s3:::semi1proyecto--g6/Fotos_Publicadas/*"
        ]
      }
    ]
  }
  ```
- **CORS:** Configurado con métodos `GET` y `HEAD` desde cualquier origen `*` para la correcta visualización en los navegadores web.

### 3.2 Bucket de hosting web `proyecto-web--g6`

- **Propósito:** Alojar la interfaz de usuario web SPA generada por Vite.
- **Configuración:**
  - Static website hosting: Habilitado.
  - Index document: `index.html`.
  - Error document: `index.html` (imprescindible para el enrutamiento del lado del cliente con React Router; de lo contrario, una recarga en `/login`, `/friends` o `/profile` produciría un error 404 HTTP de S3).
- **Endpoint público generado:**  
  `http://proyecto-web--g6.s3-website-us-east-1.amazonaws.com`
- **Política de acceso público:**
  ```json
  {
    "Version": "2012-10-17",
    "Statement": [
      {
        "Sid": "PublicReadGetObject",
        "Effect": "Allow",
        "Principal": "*",
        "Action": "s3:GetObject",
        "Resource": "arn:aws:s3:::proyecto-web--g6/*"
      }
    ]
  }
  ```

---

## 4. Capa de Cómputo, Red y Balanceo

### 4.1 Security Groups

La seguridad de red se definió en capas siguiendo una arquitectura de zonas de confianza:

```
[ Internet ] ──( Puerto 80 )──> [ g6-sg-elb ] ──( Puerto 5000 )──> [ g6-sg-backend ] ──( Puerto 3306 )──> [ g6-sg-rds ]
```

1. **`g6-sg-elb`:** Asignado al balanceador de carga.
   - Entrada: Puerto `80` (HTTP) desde `0.0.0.0/0`.
   - Salida: Puerto `5000` dirigido exclusivamente al security group de los backends.
2. **`g6-sg-backend`:** Asignado a ambas instancias EC2.
   - Entrada: Puerto `5000` permitido únicamente con origen en el security group `g6-sg-elb`. Adicionalmente puerto `22` (SSH) restringido para mantenimiento de los administradores.
   - Salida: Toda salida permitida (acceso a RDS en el 3306, endpoints de AWS Translate, Cognito y API Gateway).
3. **`g6-sg-rds`:** Asignado a la instancia de base de datos MySQL.
   - Entrada: Puerto `3306` con origen exclusivo en el security group `g6-sg-backend`.

### 4.2 Instancias EC2 (`ec2-node-g6` y `ec2-python-g6`)

Se implementó alta disponibilidad mediante redundancia geográfica entre zonas de disponibilidad:

| Parámetro | EC2 No. 1 (`ec2-node-g6`) | EC2 No. 2 (`ec2-python-g6`) |
|---|---|---|
| **Sistema Operativo** | Ubuntu Server 24.04 LTS | Ubuntu Server 24.04 LTS |
| **Zona de Disponibilidad** | `us-east-1c` | `us-east-1b` |
| **Tipo de Instancia** | `t3.micro` (2 vCPU, 1 GiB RAM) | `t3.micro` (2 vCPU, 1 GiB RAM) |
| **Tecnología Backend** | Node.js (TypeScript + Express) | Python (Flask + Gunicorn) |
| **Gestor de Procesos** | PM2 (`semisocial-node`) con inicio automático | Systemd (`semisocial.service`) con reinicio en fallo |
| **Puerto de Escucha** | `5000` | `5000` |
| **Rol IAM Asociado** | `Semi-EC2-AppRole` | `Semi-EC2-AppRole` |

### 4.3 Application Load Balancer `elb-semisocial-g6`

- **Tipo:** Application Load Balancer (ALB), Internet-facing, desplegado en las subredes públicas de `us-east-1a`, `us-east-1b` y `us-east-1c`.
- **Target Group:** `tg-semisocial-g6` con protocolo HTTP en el puerto `5000`.
- **Health Check:** `GET /api/health`, esperando código `200 OK`, con intervalo de 10 segundos, umbral saludable de 2 y umbral no saludable de 2.
- **Configuración de Balanceo:** Stickiness desactivado para garantizar distribución equitativa de peticiones por round-robin entre ambos motores de ejecución.
- **Soporte de WebSockets:** El balanceador mantiene conexiones persistentes dúplex para el chat en tiempo real a través de la ruta `/api/ws`.
- **DNS Público:**  
  `http://elb-semisocial-g6-13725760.us-east-1.elb.amazonaws.com`

### 4.4 Prueba de tolerancia a fallos

Para validar la resiliencia de la arquitectura, se realizaron pruebas de estrés y detención intencional de servidores:

1. **Estado Normal (Ambas EC2 encendidas):** 20 peticiones consecutivas al endpoint `/api/health` arrojaron exactamente 10 respuestas provenientes del servidor Node.js y 10 respuestas provenientes del servidor Python.
2. **Falla simulada en Python (`ec2-python-g6` detenida):** El target group detectó el fallo en menos de 20 segundos marcándola como `unused`. El 100% del tráfico (20 de 20 peticiones) continuó respondiendo con código `200 OK` a través de Node.js sin interrupción del servicio para los usuarios.
3. **Recuperación automática:** Al encender nuevamente la instancia, el servicio systemd levantó la aplicación y el ALB la incorporó nuevamente al grupo saludable de forma transparente.

---

## 5. Base de Datos: Amazon RDS MySQL

### 5.1 Parámetros de conexión y motor

- **Identificador:** `semi-rds-g6`
- **Motor:** MySQL Community 8.0.35
- **Clase de instancia:** `db.t3.micro`
- **Almacenamiento:** 20 GiB General Purpose SSD (gp2)
- **Base de datos inicial:** `semisocial`
- **Puerto:** `3306`

### 5.2 Modelo relacional y tablas

El esquema fue normalizado para garantizar integridad referencial y soportar las relaciones sociales de la plataforma:

1. **`usuarios`:** Identificador interno, sub de Cognito, username, nombre completo, correo, DPI (13 dígitos), contraseña en hash MD5, clave de foto de perfil y fecha de creación.
2. **`amistades`:** Registra las solicitudes y relaciones de amistad entre usuarios con estados (`pending`, `accepted`, `rejected`), garantizando unicidad mediante pares ordenados (`usuario_menor`, `usuario_mayor`).
3. **`publicaciones`:** Publicaciones creadas por los usuarios, almacenando la referencia a la clave de S3 de la fotografía y la descripción textual.
4. **`etiquetas`:** Catálogo de etiquetas generadas automáticamente por Amazon Rekognition sobre las imágenes publicadas.
5. **`publicacion_etiquetas`:** Tabla intermedia de relación muchos a muchos entre publicaciones y etiquetas.
6. **`comentarios`:** Comentarios asociados a publicaciones específicas indicando autor y contenido.
7. **`mensajes`:** Historial de mensajería privada entre pares para el módulo de chat en vivo.

---

## 6. Módulo Serverless: API Gateway y AWS Lambda

### 6.1 Funciones Lambda de procesamiento multimedia

Las funciones Lambda fueron desarrolladas en Python 3.12 y Node.js 22, optimizadas para tiempos de respuesta menores a 500 ms:

| Función | Runtime | Ruta API Gateway | Operación |
|---|---|---|---|
| `semi-upload-profile` | Python 3.12 | `POST /upload/profile` | Decodifica la imagen en Base64, valida tipo MIME y bytes mágicos (JPEG/PNG), almacena en `Fotos_Perfil/` y devuelve la URL pública. |
| `semi-upload-post` | Python 3.12 | `POST /upload/post` | Almacena la fotografía en `Fotos_Publicadas/`, invoca `rekognition.detect_labels` (máximo 10 etiquetas, umbral >= 80%) y retorna etiquetas y clave. |
| `semi-face-compare` | Python 3.12 | `POST /face/compare` | Recibe la foto en vivo de la cámara y la clave de la foto de perfil en S3; ejecuta `rekognition.compare_faces` con umbral de 90%. |
| `lex-facultad` | Node.js 22.x | Integración directa Lex | Función de cumplimiento (fulfillment) para procesar las intenciones de horarios, ubicaciones y trámites del bot. |

### 6.2 API Gateway REST `semi-api`

- **Tipo:** REST API Regional.
- **Etapa de despliegue:** `prod`.
- **Integración:** *Lambda Proxy Integration* para transmitir cabeceras, parámetros y cuerpo de solicitud íntegros a la función.
- **Seguridad por ruta:**
  - `/upload/profile` y `/upload/post`: Acceso público con cabeceras CORS (`Access-Control-Allow-Origin: *`).
  - `/face/compare`: **Protegido mediante API Key obligatoria** (`x-api-key`). Se configuró el plan de uso `semi-plan` (límite de 10 peticiones/segundo con ráfaga de 20), utilizado únicamente por los backends en EC2 para evitar abusos externos.

---

## 7. Inteligencia Artificial y Machine Learning

### 7.1 Amazon Rekognition (Etiquetado y Comparación Facial)

1. **Detección Automática de Etiquetas (`DetectLabels`):**  
   Al subir una publicación en `semi-upload-post`, Rekognition analiza el contenido visual y extrae descriptores conceptuales (e.g., *Campus*, *Person*, *Building*, *Classroom*). Estas etiquetas se indexan en MySQL y permiten la búsqueda y filtrado dinámico mediante "pills" interactivos en el muro.
2. **Autenticación Biométrica Facial (`CompareFaces`):**  
   El módulo de login facial captura un fotograma desde la cámara web del estudiante en el navegador. La Lambda `semi-face-compare` compara la imagen de origen contra la fotografía de perfil almacenada en S3. Si la similitud calculada es igual o superior al 90%, el sistema autoriza la emisión de la sesión del usuario.

### 7.2 Amazon Translate y Amazon Comprehend (Traducción en tiempo real)

- En cada tarjeta de publicación y comentario, la interfaz ofrece botones para traducir el texto al instante a **Inglés (EN)**, **Francés (FR)**, **Portugués (PT)** y **Español (ES)**, además de volver al idioma original.
- El backend ejecuta `comprehend:DetectDominantLanguage` para determinar el idioma de entrada y seguidamente invoca `translate:TranslateText` especificando el idioma destino. La autenticación con los servicios de AWS se realiza de manera nativa mediante el rol IAM `Semi-EC2-AppRole` asignado a la instancia EC2.

---

## 8. Autenticación y Asistencia Virtual

### 8.1 Amazon Cognito User Pool `semisocial-web`

- **Identificador de Grupo de Usuarios:** `us-east-1_SisCvhODl`
- **Cliente de Aplicación (App Client):** `uecp0pmtfpgohf7dhcb3hom03` (creado como Single-Page Application, sin secreto de cliente para compatibilidad con navegadores).
- **Atributos de Registro:**
  - Estándar: `username` (identificador único), `email` (verificado), `name` (nombre completo).
  - Personalizado: `custom:dpi` (tipo String, longitud exacta de 13 caracteres numéricos, mutable).
- **Flujo de Registro y Verificación:**
  1. El cliente completa el formulario y carga su fotografía de perfil.
  2. La app invoca `CognitoUserPool.signUp()`.
  3. Cognito genera un código numérico aleatorio y envía un correo electrónico al estudiante con la plantilla personalizada en español:  
     *"Hola, tu código para activar tu cuenta de Semi-Social es {####}"*.
  4. El estudiante ingresa el código y el cliente llama a `confirmRegistration()`. Una vez confirmado, los datos se sincronizan con la base de datos MySQL.

### 8.2 Amazon Lex V2 Bot `semi-facultad-bot` y Lambda `lex-facultad`

- **Bot ID:** `ATKPKEOCIF`
- **Idioma:** Español (Estados Unidos / América Latina) - `es_US`
- **Alias de Producción:** `produccion` (Alias ID: `ZR3IKRLA3B`), enlazado a la Versión 1 del bot y con la función Lambda `lex-facultad` habilitada como hook de fulfillment.
- **Intenciones (Intents):**
  1. `Horarios`: Responde los horarios de atención de las dependencias de la facultad utilizando el slot personalizado `TipoLugar` (`biblioteca`, `control academico`, `secretaria`, `laboratorios`, `asistencia estudiantil`).
  2. `PreguntasFrecuentes`: Responde dudas sobre asignación de cursos, solicitud de constancias y consulta de notas.
  3. `Ubicacion`: Brinda referencias sobre edificios de la facultad (Edificio T-3, Decanato, salones de laboratorio).
  4. `Contacto`: Suministra teléfonos, correos y canales oficiales de comunicación institucional.
  5. `FallbackIntent`: Captura expresiones no reconocidas y sugiere formular la pregunta con términos clave.

### 8.3 Amazon Cognito Identity Pool `semisocial_identity_pool`

- **Identity Pool ID:** `us-east-1:6576a232-d9f1-4330-add0-54801562587e`
- **Configuración:** Acceso no autenticado (Guest) habilitado.
- **Rol IAM Asignado:** `Semi-Identity-Unauth-Role` con la política `G6-Lex-Visitantes`.
- **Integración:** El SDK `@aws-sdk/client-lex-runtime-v2` en el navegador obtiene credenciales temporales de AWS STS para invocar el método `RecognizeTextCommand` sobre el alias `produccion` de Lex sin requerir que el usuario haya iniciado sesión en la plataforma.

---

## 9. Aplicación Web Frontend

### 9.1 Arquitectura de la interfaz

La interfaz fue desarrollada con **React 19**, **Vite** y **Tailwind CSS v4**. Está diseñada con una estética dark profesional inspirada en directrices de usabilidad moderna:
- **Pantalla dividida (Split-Screen):** El login y registro presentan un panel contextual universitario a la izquierda y el formulario funcional a la derecha.
- **Sin emojis en código:** Se utiliza exclusivamente la librería vectorial `@heroicons/react/24/outline` para mantener sobriedad académica.
- **Previsualización optimista:** Para evitar el desfase por la consistencia eventual de Amazon S3, las publicaciones recién creadas se renderizan inmediatamente con un preview local en memoria, mientras un sistema de reintento automático (`backoff` exponencial) resuelve la URL final en S3.

### 9.2 Módulo de Chat con WebSockets

- Conexión persistente mediante `ws://<DNS_ALB>/api/ws?token=<JWT>`.
- Heartbeat bidireccional (ping cada 30 segundos) para evitar que el Load Balancer cierre la conexión por inactividad.
- Notificaciones instantáneas de mensajes enviados y recibidos entre amigos aceptados.

### 9.3 Integración del widget de Amazon Lex

- Botón flotante accesible desde cualquier sección de la aplicación web.
- Ventana conversacional interactiva con envío de texto y renderizado de respuestas en formato chat, con scroll automático e indicadores de estado del bot.

---

## 10. Evidencias de Configuración y Funcionamiento

### 10.1 Recursos de IAM

Usuarios IAM configurados con políticas de acceso mínimo:

![Usuarios IAM](img/iam-usuarios.png)

| Usuario `derek` | Usuario `jose` |
|:---:|:---:|
| ![derek](img/iam-derek.png) | ![jose](img/iam-jose.png) |
| **Usuario `jax`** | **Usuario `miguel`** |
| ![jax](img/iam-jax.png) | ![miguel](img/iam-miguel.png) |

Roles de ejecución para servidores EC2, Lambdas y Lex:

| Rol `Semi-EC2-AppRole` | Rol `Semi-LexFulfillment-Role` |
|:---:|:---:|
| ![Semi-EC2-AppRole](img/role-ec2-app.png) | ![Semi-LexFulfillment-Role](img/role-lex-fulfillment.png) |

Permisos de Amazon Translate y Comprehend asignados al rol de las EC2:

![Políticas de Translate y Comprehend en EC2](img/CapturasIntegrante4/iam-ec2-translate-role.png)

### 10.2 Buckets de Amazon S3

Lista de buckets creados en la región `us-east-1`:

![Buckets de S3](img/CapturasIntegrante4/s3-website-lista.png)

Carga exitosa de los artefactos compilados del frontend en `proyecto-web--g6`:

![Carga de archivos en proyecto-web--g6](img/CapturasIntegrante4/s3-website-upload.png)

### 10.3 Capa EC2 y Grupos de Seguridad

Instancias EC2 en ejecución con redundancia de zonas de disponibilidad:

![Instancias EC2](img/CapturasIntegrante2/ec2-ambas-running.png)

Configuración de seguridad y rol en la instancia `ec2-python-g6`:

![Seguridad EC2 Python](img/CapturasIntegrante2/ec2-python-seguridad.png)

Grupos de seguridad enlazados:

| Security Group ALB | Security Group Backend | Security Group RDS |
|:---:|:---:|:---:|
| ![SG ELB](img/sg-elb.png) | ![SG Backend](img/sg-backend.png) | ![SG RDS](img/sg-rds.png) |

### 10.4 Balanceador de Carga y Tolerancia a Fallos

Application Load Balancer activo y listener HTTP en el puerto 80:

| Balanceador Activo | Listener HTTP:80 |
|:---:|:---:|
| ![ALB Activo](img/CapturasIntegrante2/elb-activo.png) | ![Listener ALB](img/CapturasIntegrante2/elb-listener.png) |

Target group con las dos instancias saludables:

![Target Group Saludable](img/CapturasIntegrante2/tg-targets.png)

Prueba de conmutación por error (detención de `ec2-python-g6` y atención continua con Node.js):

| Instancia detenida | Instancia marcada como Unused | Respuesta continua en ALB |
|:---:|:---:|:---:|
| ![EC2 Detenida](img/CapturasIntegrante2/falla-python-detenida.png) | ![TG Falla](img/CapturasIntegrante2/falla-python-tg.png) | ![App en Node](img/CapturasIntegrante2/falla-python-app.png) |

### 10.5 Base de Datos RDS MySQL

Tablas del esquema relacional en MySQL:

![Tablas RDS](img/rds-tablas.png)

### 10.6 Lambdas y API Gateway

Código y configuración de variables de entorno en la Lambda `semi-upload-post`:

| Código fuente de la Lambda | Variable BUCKET_NAME |
|:---:|:---:|
| ![Código Lambda](img/CapturasIntegrante3/configuracionLambda.png) | ![Variables Lambda](img/CapturasIntegrante3/variables.png) |

Prueba de detección de etiquetas con Amazon Rekognition en `semi-upload-post`:

![Prueba Rekognition](img/CapturasIntegrante3/fotoPublicada.png)

Validación de API Gateway con pruebas de API Key y CORS:

| Pruebas con test_api.py | Preflight CORS Exitoso |
|:---:|:---:|
| ![Test API](img/CapturasIntegrante3/PruebasTestPy.png) | ![CORS Test](img/CapturasIntegrante3/ConexionExitosa.png) |

### 10.7 Amazon Cognito (User Pool e Identity Pool)

Creación y configuración del User Pool `semisocial-web` (`us-east-1_SisCvhODl`):

| Asistente de Creación de SPA | User Pool Registrado |
|:---:|:---:|
| ![Cognito Creación](img/CapturasIntegrante4/ajuste%20(2).png) | ![Cognito Pool ID](img/CapturasIntegrante4/ajuste%20(5).png) |

Atributo personalizado de DPI y plantilla de verificación por correo:

| Atributo custom:dpi | Plantilla de Correo |
|:---:|:---:|
| ![Atributo DPI](img/CapturasIntegrante4/ajuste%20(6).png) | ![Template Email](img/CapturasIntegrante4/ajuste%20(7).png) |

Creación del Identity Pool `semisocial_identity_pool`:

| Configuración de Acceso No Autenticado | Propiedades del Identity Pool |
|:---:|:---:|
| ![Identity Pool Paso 1](img/CapturasIntegrante4/ajuste%20(41).png) | ![Identity Pool Paso 2](img/CapturasIntegrante4/ajuste%20(42).png) |

### 10.8 Amazon Lex V2 y Lambda de Fulfillment

Creación del bot `semi-facultad-bot` e implementación de la Lambda `lex-facultad`:

| Configuración del Bot | Código de la Lambda lex-facultad |
|:---:|:---:|
| ![Bot Lex Creación](img/CapturasIntegrante4/ajuste%20(17).png) | ![Lambda Lex Código](img/CapturasIntegrante4/ajuste%20(14).png) |

Lista de intenciones y configuración del enlace de cumplimiento con la Lambda:

| Intenciones Configuradas | Enlace de Cumplimiento Lambda |
|:---:|:---:|
| ![Intenciones Lex](img/CapturasIntegrante4/ajuste%20(37).png) | ![Fulfillment Lambda](img/CapturasIntegrante4/ajuste%20(27).png) |

Prueba interactiva del bot en consola y alias de producción:

| Prueba en Consola con Lambda | Alias `produccion` Activo |
|:---:|:---:|
| ![Prueba Lex Consola](img/CapturasIntegrante4/ajuste%20(39).png) | ![Alias Lex Produccion](img/CapturasIntegrante4/ajuste%20(40).png) |

### 10.9 Aplicación Web y Pruebas de Funcionamiento

Formulario de registro y recepción del código de confirmación por correo:

| Pantalla de Registro | Código de Verificación en Correo |
|:---:|:---:|
| ![Registro Web](img/CapturasIntegrante4/web-registro.png) | ![Código Correo](img/CapturasIntegrante4/cognito-email-codigo.png) |

Inicio de sesión biométrico mediante cámara web:

![Login Facial](img/CapturasIntegrante4/web-login-facial.png)

Muro de publicaciones con etiquetas de Rekognition, traducción en vivo y widget de Lex:

![Muro con Traducción](img/CapturasIntegrante4/web-feed-translate.png)

---

## 11. Librerías y Tecnologías Utilizadas

### Frontend (React + Vite)
- `react` (v19.0.0) y `react-dom`: Núcleo de componentes reactivos y gestión del DOM virtual.
- `react-router-dom` (v7.2.0): Enrutamiento client-side con soporte para history API y redirects.
- `@tailwindcss/vite` y `tailwindcss` (v4.0.0): Motor utilitario de estilos con compilación JIT.
- `@heroicons/react` (v2.2.0): Iconografía vectorial SVG sin sobrecarga de fuentes externas.
- `amazon-cognito-identity-js` (v6.3.12): SDK ligero para registro, confirmación de cuentas e inicio de sesión seguro en Cognito User Pools.
- `@aws-sdk/client-lex-runtime-v2` (v3.758.0): Cliente modular de AWS SDK v3 para enviar mensajes al bot de Lex.
- `@aws-sdk/credential-provider-cognito-identity` (v3.758.0): Proveedor de credenciales temporales a partir de Cognito Identity Pools.

### Backend Node.js
- `express`: Framework HTTP ligero para servicios REST.
- `mysql2`: Cliente optimizado para consultas preparadas y pooling con Amazon RDS MySQL.
- `jsonwebtoken`: Emisión y validación de tokens de sesión con algoritmo HS256.
- `bcryptjs`: Funciones de hashing unidireccional de contraseñas.
- `@aws-sdk/client-translate` y `@aws-sdk/client-cognito-identity-provider`: Integración con servicios de AWS mediante roles de instancia.
- `ws`: Servidor WebSocket nativo para mensajería en tiempo real.

### Backend Python
- `flask`: Microframework WSGI para los endpoints de la API.
- `pymysql`: Conector de base de datos MySQL puro en Python con soporte de transacciones seguras.
- `pyjwt`: Codificación y decodificación de tokens JWT.
- `boto3`: SDK oficial de AWS para Python para invocar Translate, Comprehend y Cognito.
- `gunicorn`: Servidor HTTP WSGI para producción gestionado bajo systemd.
- `simple-websocket`: Manejo de conexiones dúplex WebSocket.

### Funciones Serverless (AWS Lambda)
- `boto3`: Acceso nativo sin dependencias externas a Amazon S3 y Amazon Rekognition.
- Node.js runtime nativo para `lex-facultad` con serialización JSON estándar de Lex V2.

---

## 12. Conclusiones

1. **Separación de responsabilidades y cómputo híbrido:** La combinación de servidores dedicados en Amazon EC2 tras un ALB junto con una capa serverless en AWS Lambda y API Gateway demostró ser una solución costo-eficiente y escalable. Las tareas de alto consumo de CPU y memoria (como el procesamiento y redimensionamiento de imágenes) se delegan a Lambda sin sobrecargar los hilos de los servidores backend.
2. **Eliminación de credenciales estáticas con Roles IAM:** La utilización de roles de instancia (`Semi-EC2-AppRole`) y roles de ejecución (`Semi-Lambda-Upload-Role`) erradica por completo la necesidad de almacenar llaves de acceso secretas en archivos de configuración o código fuente, mitigando riesgos de seguridad y simplificando la rotación de credenciales administrada por AWS STS.
3. **Consistencia eventual y resiliencia en frontend:** El uso de técnicas de previsualización optimista en interfaces modernas de usuario previene errores derivados de la propagación distribuida de Amazon S3, ofreciendo una experiencia fluida al usuario final sin bloquear la interactividad de la red social.
4. **Alta disponibilidad entre zonas de disponibilidad:** La distribución de servidores en distintas Availability Zones (`us-east-1b` y `us-east-1c`) con health checks activos en el Application Load Balancer garantiza que el sistema continúe prestando servicio al 100% de los usuarios ante fallos catastróficos en centros de datos individuales.
