<!--
  Sección del README.md principal del repositorio (Integrante 3).
  Cómo usarla: copia este contenido dentro del README.md de la raíz, en el
  lugar que te indique el Integrante 1 (quien ensambla el archivo final).
  Reemplaza cada [CAPTURA PENDIENTE: ...] por la imagen real:
      ![descripción](docs/capturas/nombre-del-archivo.png)
  y borra este comentario.
-->

## Bucket de imágenes, funciones Lambda y API Gateway

**Responsable:** Integrante 3 (Serverless y Visión) &nbsp;|&nbsp; **Región:** us-east-1 &nbsp;|&nbsp; **Grupo:** 6

### 1. Resumen del módulo

Este módulo resuelve la carga de imágenes y el reconocimiento con inteligencia artificial.
El navegador (o el backend) nunca escribe directamente en S3: toda imagen pasa por
**API Gateway → AWS Lambda → S3**, y las Lambdas usan **Amazon Rekognition** para obtener etiquetas de
las publicaciones y para comparar rostros en el login facial.

```
Navegador / Backend ──► API Gateway (REST, etapa prod) ──► Lambda (Python 3.12) ──► S3 (semi1proyecto--g6)
                                                                    └──► Amazon Rekognition
```

| Servicio | Recurso creado | Para qué sirve |
| --- | --- | --- |
| S3 | `semi1proyecto--g6` con `Fotos_Perfil/` y `Fotos_Publicadas/` | Almacén de fotos de perfil y de publicaciones |
| IAM | Rol `Semi-Lambda-Upload-Role` | Permisos mínimos de las Lambdas |
| Lambda | `semi-upload-profile`, `semi-upload-post`, `semi-face-compare` | Procesan y guardan imágenes, etiquetan y comparan rostros |
| API Gateway | `semi-api` (REST, etapa `prod`) | Expone las 3 rutas por HTTPS |
| Rekognition | `DetectLabels` y `CompareFaces` | Etiquetas para filtros y login facial |

> **Nota sobre el nombre del bucket:** el nombre sugerido `semi1proyecto-g6` ya estaba en uso
> (los nombres de bucket son únicos en todo AWS), por lo que se utilizó `semi1proyecto--g6`.

### 2. Bucket S3

- Nombre: `semi1proyecto--g6`, región us-east-1, ACLs deshabilitadas, cifrado por defecto (SSE-S3).
- Carpetas (prefijos): `Fotos_Perfil/` y `Fotos_Publicadas/`.
- *Block Public Access* desactivado para permitir la política de lectura pública.
- **Política del bucket:** lectura pública (`s3:GetObject`) solo de los objetos de las dos carpetas;
  nadie puede listar el bucket ni escribir de forma pública (`lambdas/policies/bucket-policy.json`).
- **CORS:** solo `GET` y `HEAD` (las subidas no pasan por el navegador, van por API Gateway).

[CAPTURA PENDIENTE: lista de buckets con `semi1proyecto--g6`]
[CAPTURA PENDIENTE: bucket con las carpetas `Fotos_Perfil` y `Fotos_Publicadas` y archivos dentro]
[CAPTURA PENDIENTE: pestaña Permissions (política del bucket y CORS)]

### 3. Rol IAM de las Lambdas (mínimo privilegio)

Rol `Semi-Lambda-Upload-Role`, entidad de confianza `lambda.amazonaws.com`, con dos políticas:

1. `AWSLambdaBasicExecutionRole` (administrada por AWS): solo escribir logs en CloudWatch.
2. `Semi-Lambda-Upload-Policy` (propia, `lambdas/policies/Semi-Lambda-Upload-Policy.json`):

| Permiso | Recurso | Motivo |
| --- | --- | --- |
| `s3:PutObject`, `s3:GetObject` | `semi1proyecto--g6/Fotos_Perfil/*` y `semi1proyecto--g6/Fotos_Publicadas/*` | Guardar imágenes; leer la foto de perfil al comparar rostros |
| `rekognition:DetectLabels`, `rekognition:CompareFaces` | `*` (estas acciones no admiten recurso específico) | Etiquetado y comparación facial |

No se concede permiso de borrado, de listado ni de acceso a otras carpetas.

[CAPTURA PENDIENTE: rol con sus 2 políticas y relación de confianza]
[CAPTURA PENDIENTE: JSON de la política `Semi-Lambda-Upload-Policy`]

### 4. Funciones Lambda

Las tres usan Python 3.12 y comparten el mismo rol. Código en `lambdas/`.

| Función | Ruta | Qué hace |
| --- | --- | --- |
| `semi-upload-profile` | `POST /upload/profile` | Valida la imagen (tipo, tamaño y bytes iniciales), la guarda en `Fotos_Perfil/` y devuelve `key` y `url` |
| `semi-upload-post` | `POST /upload/post` | Igual, en `Fotos_Publicadas/`, y además llama a `DetectLabels` (máx. 10 etiquetas, confianza ≥ 80 %) |
| `semi-face-compare` | `POST /face/compare` | Compara la foto de la cámara contra la foto de perfil en S3 con `CompareFaces` (umbral 90 %) |

Decisiones de diseño relevantes:

- La imagen viaja en **base64 dentro de un JSON**, lo que simplifica la integración con API Gateway.
- El nombre del archivo en S3 lo genera la Lambda (UUID), nunca el usuario: evita colisiones y rutas maliciosas.
- Se verifican los **bytes iniciales** del archivo además del `contentType`, porque este último lo envía el cliente.
- Si Rekognition falla al etiquetar, la imagen **se guarda igualmente** y `labels` va vacío.
- `face-compare` solo acepta `targetKey` dentro de `Fotos_Perfil/` y distingue «no se detectó rostro» (422) de «no coincide» (`match: false`).
- El nombre del bucket y el umbral de similitud se configuran con variables de entorno, sin tocar el código.

[CAPTURA PENDIENTE: lista de las 3 funciones Lambda]
[CAPTURA PENDIENTE: `semi-upload-profile` (código, variables de entorno, rol)]
[CAPTURA PENDIENTE: `semi-upload-post` (código, variables de entorno, rol)]
[CAPTURA PENDIENTE: `semi-face-compare` (código, variables de entorno, rol)]
[CAPTURA PENDIENTE: prueba exitosa de `semi-upload-post` mostrando las etiquetas]

### 5. API Gateway

REST API `semi-api` (regional), etapa `prod`, con *Lambda proxy integration*:

| Método y ruta | Lambda | Protección |
| --- | --- | --- |
| `POST /upload/profile` | `semi-upload-profile` | CORS habilitado |
| `POST /upload/post` | `semi-upload-post` | CORS habilitado |
| `POST /face/compare` | `semi-face-compare` | **API key obligatoria** (`x-api-key`) con plan de uso (rate 10, burst 20) |

La API key solo la usa el backend desde variables de entorno de las EC2. Las rutas de carga no llevan
clave porque las llama el navegador, donde una clave sería visible para cualquiera.

[CAPTURA PENDIENTE: árbol de recursos con los 3 métodos POST]
[CAPTURA PENDIENTE: `/face/compare` con «API key required»]
[CAPTURA PENDIENTE: plan de uso `semi-plan` (sin mostrar el valor de la clave)]
[CAPTURA PENDIENTE: etapa `prod` con la Invoke URL]

### 6. Pruebas realizadas

Se ejecutó `lambdas/test_api.py` contra la API desplegada:

| Prueba | Resultado |
| --- | --- |
| `POST /upload/profile` con un PNG | 200, imagen guardada en `Fotos_Perfil/` |
| `POST /upload/post` con una foto real | 200, imagen en `Fotos_Publicadas/` y etiquetas devueltas por Rekognition (`Driving`, `Person`, `Transportation`, `Vehicle`) |
| `POST /face/compare` sin API key | 403 `Forbidden` (la clave protege la ruta) |
| `POST /face/compare` con API key | 200, `match: true`, `similarity: 100.0` |
| Preflight `OPTIONS /upload/post` | 200 con `Access-Control-Allow-Origin: *` |

Pruebas de validación en la consola de Lambda (eventos en `lambdas/events/`): tipo no permitido,
base64 inválido, imagen ausente y bytes que no coinciden con el tipo declarado responden 400 con
`ok: false`.

[CAPTURA PENDIENTE: salida de `test_api.py`]
[CAPTURA PENDIENTE: respuesta del preflight CORS]
[CAPTURA PENDIENTE: Rekognition, etiquetas de una publicación y comparación facial exitosa]

### 7. Integración con el resto del sistema

- **Frontend (Integrante 4):** llama a `/upload/profile` y `/upload/post` con la imagen en base64
  (reducida a ≤ 1.5 MB) y envía a su backend el `key`, la `url` y las `labels` recibidos.
- **Backend (Integrantes 1 y 2):** guarda `key`, `url` y `labels` en RDS; en el login facial llama a
  `/face/compare` con la foto de la cámara y el `key` de la foto de perfil guardada en la base de datos.
- Las Lambdas **no acceden a RDS**: devuelven datos y es el backend quien los persiste.
