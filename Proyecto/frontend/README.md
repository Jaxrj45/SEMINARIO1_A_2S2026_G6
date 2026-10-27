# Semi-Social - Frontend Web (React + Vite)

Frontend de la red social **Semi-Social** desarrollado para el laboratorio de Seminario de Sistemas 1 (USAC).
Responsable: **Integrante 4 (Miguel - 202300765)**.

---

## 🚀 Tecnologías Utilizadas

- **Framework:** React 19 + Vite
- **Estilos:** Tailwind CSS v4
- **Rutas:** React Router DOM v7
- **Autenticación en la Nube:** Amazon Cognito User Pool (`amazon-cognito-identity-js`)
- **Chatbot Inteligente:** Amazon Lex V2 (`@aws-sdk/client-lex-runtime-v2` con Cognito Identity Pool)
- **Carga de Imágenes:** API Gateway + AWS Lambda (`Fotos_Perfil` y `Fotos_Publicadas` en S3)
- **Visión Artificial:** Amazon Rekognition (etiquetado automático de posts y biometría para login facial)
- **Traducción:** Amazon Translate (3 idiomas + español)
- **Comunicación en Tiempo Real:** WebSockets (`ws://{ALB_DNS}/api/ws`)

---

## 📁 Estructura del Proyecto

```
Proyecto/frontend/
├── public/
├── src/
│   ├── api/
│   │   ├── apiClient.js      # Cliente centralizado con soporte mock y tokens
│   │   └── mocks.js          # Mocks exactos basados en contracts/examples/
│   ├── components/
│   │   ├── CreatePostModal.jsx # Subida de foto (archivo o webcam) + Rekognition
│   │   ├── LexBot.jsx          # Botón flotante y widget interactivo de Lex
│   │   ├── Navbar.jsx          # Barra superior con datos de sesión
│   │   ├── PostCard.jsx        # Publicación con tags, comentarios y traducción
│   │   └── WebcamModal.jsx     # Captura en vivo con la cámara web
│   ├── config/
│   │   └── env.js            # Lectura de variables de entorno con fallbacks
│   ├── context/
│   │   └── AuthContext.jsx   # Estado de sesión (Cognito + backend JWT)
│   ├── services/
│   │   ├── chatSocket.js     # Manejador de WebSocket con ping/pong cada 30s
│   │   ├── cognito.js        # Operaciones de User Pool (signUp, confirm, signIn)
│   │   └── lex.js            # Cliente de Amazon Lex V2 con Identity Pool
│   ├── views/
│   │   ├── Chat.jsx          # Chat en tiempo real con amigos
│   │   ├── Feed.jsx          # Muro de publicaciones y filtros Rekognition
│   │   ├── Friends.jsx       # Descubrir usuarios y gestión de solicitudes
│   │   ├── Login.jsx         # Login tradicional y login facial
│   │   ├── Profile.jsx       # Edición de perfil con validación de contraseña
│   │   └── Register.jsx      # Registro (datos + foto) y confirmación por correo
│   ├── App.jsx               # Enrutamiento protegido
│   ├── index.css             # Configuración base de Tailwind
│   └── main.jsx
├── .env.example              # Plantilla de variables de entorno
├── .env                      # Variables locales configuradas con MOCK por defecto
├── package.json
└── vite.config.js
```

---

## 🛠️ Instalación y Ejecución

### 1. Instalar dependencias
```bash
cd Proyecto/frontend
npm install
```

### 2. Modo MOCK (Desarrollo y Pruebas sin AWS)
Por defecto, el archivo `.env` viene configurado con:
```env
VITE_MOCK=true
```
En este modo:
- No requiere conexión a AWS ni base de datos local.
- Responde inmediatamente con los datos de ejemplo del contrato (`Proyecto/contracts/examples/`).
- Simula inicio de sesión tradicional y facial, publicaciones con etiquetas de Rekognition, traducción de texto, solicitudes de amistad y chat interactivo con respuestas automáticas.

Para correrlo en desarrollo:
```bash
npm run dev
```
La aplicación abrirá en `http://localhost:3000`.

---

## ☁️ Conexión con Infraestructura Real en AWS

Cuando la infraestructura de AWS (ALB, API Gateway, Cognito y Lex) esté lista, cambia en `.env`:

```env
VITE_MOCK=false
VITE_API_BASE=http://<DNS-DEL-BALANCEADOR-ALB>
VITE_UPLOAD_API=https://<API-GATEWAY-ID>.execute-api.us-east-1.amazonaws.com/prod
VITE_AWS_REGION=us-east-1
VITE_COGNITO_USER_POOL_ID=us-east-1_xxxxxxxxx
VITE_COGNITO_CLIENT_ID=xxxxxxxxxxxxxxxxxxxxxxxxxx
VITE_IDENTITY_POOL_ID=us-east-1:xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
VITE_LEX_BOT_ID=xxxxxxxxxx
VITE_LEX_BOT_ALIAS_ID=xxxxxxxxxx
VITE_LEX_LOCALE_ID=es_419
```

### Compilar para Producción y Despliegue en S3
Para generar el build estático que se sube al bucket `proyecto-web-g6`:
```bash
npm run build
```
Los archivos optimizados quedarán en la carpeta `dist/`, listos para sincronizarse con S3:
```bash
aws s3 sync dist/ s3://proyecto-web-g6/ --delete
```
