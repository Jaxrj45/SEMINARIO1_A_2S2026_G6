# Módulo Serverless y Visión (Lambdas, API Gateway, S3, Rekognition)

Carga de imágenes y reconocimiento de imágenes/rostros de **Semi-Social**.
Región: `us-east-1`. Grupo: 6.

## Flujo

```
Navegador / Backend ──► API Gateway (REST, etapa prod) ──► Lambda (Python 3.12) ──► S3 (semi1proyecto--g6)
                                                                    └──► Amazon Rekognition
```

## Estructura

```
lambdas/
├── upload-profile/lambda_function.py   -> POST /upload/profile   (guarda en Fotos_Perfil/)
├── upload-post/lambda_function.py      -> POST /upload/post      (guarda en Fotos_Publicadas/ + etiquetas)
├── face-compare/lambda_function.py     -> POST /face/compare     (login facial, requiere x-api-key)
├── policies/                           -> JSON de la política del rol, política del bucket y CORS
├── events/                             -> eventos de prueba para la pestaña "Test" de Lambda
├── make_event.py                       -> genera eventos de prueba desde fotos reales
└── test_api.py                         -> prueba de humo contra la API desplegada
```

## Funciones Lambda

Las tres usan runtime **Python 3.12**, arquitectura x86_64 y el rol `Semi-Lambda-Upload-Role`.
No requieren dependencias externas: `boto3` ya viene incluido en Lambda.

| Función | Timeout | Memoria | Variables de entorno |
| --- | --- | --- | --- |
| `semi-upload-profile` | 15 s | 256 MB | `BUCKET_NAME=semi1proyecto--g6` |
| `semi-upload-post` | 20 s | 256 MB | `BUCKET_NAME=semi1proyecto--g6` |
| `semi-face-compare` | 20 s | 256 MB | `BUCKET_NAME=semi1proyecto--g6`, `SIMILARITY_THRESHOLD=90` |

## Contrato de la API

Todas las respuestas son JSON. Éxito: `{ "ok": true, "data": ... }`.
Error: `{ "ok": false, "error": { "code": "...", "message": "..." } }`.

### `POST {UPLOAD_API}/upload/profile` y `POST {UPLOAD_API}/upload/post`

Petición:

```json
{ "fileName": "foto.jpg", "contentType": "image/jpeg", "imageBase64": "/9j/4AAQ..." }
```

Respuesta (`labels` solo en `/upload/post`):

```json
{ "ok": true, "data": {
  "key": "Fotos_Publicadas/8f3a....jpg",
  "url": "https://semi1proyecto--g6.s3.amazonaws.com/Fotos_Publicadas/8f3a....jpg",
  "labels": ["Beach", "Sea", "Outdoors"] } }
```

- Tipos permitidos: `image/jpeg` e `image/png`. Se verifican también los bytes iniciales del archivo.
- Máximo 4 MB ya decodificada (el front reduce la imagen antes de enviarla).
- Se acepta `imageBase64` con o sin prefijo `data:image/...;base64,`.
- El nombre del archivo en S3 lo genera la Lambda (UUID); `fileName` no se usa como ruta.

### `POST {UPLOAD_API}/face/compare` (solo desde el backend, cabecera `x-api-key`)

Petición:

```json
{ "sourceBase64": "/9j/4AAQ...", "targetKey": "Fotos_Perfil/21bc....jpg" }
```

Respuesta:

```json
{ "ok": true, "data": { "match": true, "similarity": 98.2 } }
```

### Códigos de error

| HTTP | `code` | Cuándo |
| --- | --- | --- |
| 400 | `INVALID_BODY` | El cuerpo no es JSON válido |
| 400 | `INVALID_TYPE` | `contentType` distinto de JPEG/PNG |
| 400 | `INVALID_IMAGE` | Falta la imagen, no es base64 o los bytes no coinciden con el tipo |
| 400 | `INVALID_TARGET` | `targetKey` fuera de `Fotos_Perfil/` |
| 403 | (API Gateway) `Forbidden` | Falta o es inválida la API key en `/face/compare` |
| 404 | `TARGET_NOT_FOUND` | La foto de perfil indicada no existe |
| 413 | `TOO_LARGE` | La imagen supera 4 MB |
| 422 | `NO_FACE_DETECTED` | No se detectó un rostro en una de las imágenes |
| 500 | `UPLOAD_FAILED` / `COMPARE_FAILED` | Error al guardar en S3 o al llamar a Rekognition |

## API Gateway

- Tipo: **REST API** regional, nombre `semi-api`, etapa `prod`, **Lambda proxy integration** activada.
- CORS habilitado en `/upload/profile` y `/upload/post` (el navegador las llama).
- `/face/compare` exige **API key** (`semi-face-key`) mediante el plan de uso `semi-plan`
  (rate 10, burst 20). La clave solo vive en variables de entorno de las EC2; **nunca en el front ni en Git**.

## Pruebas

1. Eventos para la consola de Lambda (pestaña *Test*): archivos en `events/`.
   Con fotos reales: `python make_event.py post foto.jpg` o
   `python make_event.py face selfie2.jpg Fotos_Perfil/selfie1.jpg`.
2. Prueba de humo contra la API desplegada (configura las variables de entorno primero):

```
export SEMI_API_URL="https://TU_ID.execute-api.us-east-1.amazonaws.com/prod"
export SEMI_API_KEY="..."
python test_api.py
```

3. Prueba de CORS (preflight):

```
curl -i -X OPTIONS "$SEMI_API_URL/upload/post" \
  -H "Origin: http://ejemplo.com" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: content-type"
```

Resultado esperado: `200` con `Access-Control-Allow-Origin: *`.

## Seguridad y permisos

- Rol `Semi-Lambda-Upload-Role` (confianza: `lambda.amazonaws.com`) con `AWSLambdaBasicExecutionRole`
  más `Semi-Lambda-Upload-Policy` (`policies/Semi-Lambda-Upload-Policy.json`): solo `PutObject`/`GetObject`
  sobre `Fotos_Perfil/*` y `Fotos_Publicadas/*`, y `DetectLabels`/`CompareFaces` de Rekognition.
- Bucket con lectura pública únicamente de las dos carpetas de imágenes (`policies/bucket-policy.json`),
  sin permiso de listado ni de escritura pública.
- Las Lambdas no tienen claves de acceso en el código: usan las credenciales temporales de su rol.
