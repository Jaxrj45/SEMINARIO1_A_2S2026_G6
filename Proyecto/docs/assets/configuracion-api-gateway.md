[ ← Regresar ](../../README.md)

# Configuración de API Gateway

Todo se hace desde la consola web de AWS, en la región **us-east-1**. Antes hay que tener las 3 Lambdas creadas ([configuracion-lambda.md](configuracion-lambda.md)).

Las líneas que dicen **(captura)** son las que van al README final.

> **Importante:** tiene que ser **REST API** y no **HTTP API**. Solo la REST API tiene API keys, y la necesitamos para proteger `/face/compare`.

## Índice

1. [Crear la API](#1-crear-la-api)
2. [Rutas](#2-rutas)
3. [CORS](#3-cors)
4. [Publicar (deploy)](#4-publicar-deploy)
5. [API key para /face/compare](#5-api-key-para-facecompare)
6. [Probar](#6-probar)

## 1. Crear la API

**API Gateway** → **Create API** → **REST API** → **Build**.

| Campo | Valor |
|---|---|
| Opción | New API |
| API name | `semi-api-g6` |
| API endpoint type | Regional |

**Create API**.

## 2. Rutas

Quedan así:

| Ruta | Método | Lambda | Pide API key |
|---|---|---|---|
| `/upload/profile` | POST | `upload-profile` | No (se usa en el registro, antes de tener sesión) |
| `/upload/post` | POST | `upload-post` | No |
| `/face/compare` | POST | `face-compare` | **Sí** (solo la llama el backend) |

### 2.1 Crear los recursos

En API Gateway cada parte de la ruta es un recurso.

1. Con `/` seleccionado → **Create resource** → **Resource name**: `upload` → **Create resource**.
2. Con `/upload` seleccionado → **Create resource** → `profile`. Marcar **CORS (Cross Origin Resource Sharing)** → **Create resource**.
3. Igual con `/upload` → `post`, con CORS marcado.
4. Con `/` seleccionado → **Create resource** → `face`.
5. Con `/face` seleccionado → **Create resource** → `compare` (sin CORS, porque no la llama el navegador).

### 2.2 Crear los métodos

Para cada una de las 3 rutas finales: seleccionar el recurso → **Create method**.

| Campo | Valor |
|---|---|
| Method type | POST |
| Integration type | Lambda function |
| Lambda proxy integration | **Activado** |
| Lambda function | us-east-1 y la función de la tabla |
| Default timeout | Como viene (29 segundos) |

**Create method**. La consola le da permiso a API Gateway para llamar la Lambda sola; no hay que hacerlo a mano.

Con **Lambda proxy integration** la Lambda recibe la petición completa y es ella la que arma la respuesta (`statusCode`, `headers` y `body`), incluidos los headers de CORS.

### 2.3 Pedir la API key en /face/compare

Seleccionar `POST` de `/face/compare` → **Method request** → **Edit** → marcar **API key required** → **Save**.

Solo en ese método. Si se activa en los otros dos, el frontend ya no puede subir imágenes.

**(captura)** El árbol de recursos con los 3 métodos.

## 3. CORS

Para `/upload/profile` y `/upload/post`: seleccionar el recurso → **Enable CORS**.

| Campo | Valor |
|---|---|
| Gateway responses | Marcar **Default 4XX** y **Default 5XX** |
| Access-Control-Allow-Methods | `POST` y `OPTIONS` |
| Access-Control-Allow-Headers | `Content-Type,Authorization,X-Api-Key` |
| Access-Control-Allow-Origin | `*` |

**Save**.

Marcar **Default 4XX** y **Default 5XX** hace que los errores de API Gateway (por ejemplo, cuando la imagen es muy grande) también traigan los headers de CORS. Si no, el navegador solo muestra "CORS error" y no se sabe qué pasó.

## 4. Publicar (deploy)

**Deploy API** → **Stage**: *New stage* → **Stage name**: `prod` → **Deploy**.

En **Stages** → `prod` aparece el **Invoke URL**, algo como `https://abc123.execute-api.us-east-1.amazonaws.com/prod`. Esa es la `UPLOAD_API` que usan el frontend y los backends (sin `/` al final).

**Cada cambio en rutas, métodos o CORS necesita otro Deploy API al stage `prod`.** Si no, el cambio no se aplica aunque se vea en la consola.

**(captura)** El stage `prod` con su Invoke URL.

## 5. API key para /face/compare

### 5.1 Crear la key

**API keys** (menú de la izquierda) → **Create API key** → **Name**: `semi-face-key` → **Auto generate** → **Save**.

### 5.2 Plan de uso

Una API key solo funciona si está en un plan de uso conectado al stage.

**Usage plans** → **Create usage plan**.

| Campo | Valor |
|---|---|
| Name | `semi-face-plan` |
| Throttling | Activado: Rate `10`, Burst `20` |
| Quota | Desactivado |

**Create usage plan**. Dentro del plan:

1. **Associated stages** → **Add API stage** → API `semi-api-g6`, stage `prod` → **Add to usage plan**.
2. **Associated API keys** → **Add API key** → `semi-face-key` → **Add API key**.

### 5.3 Compartir la key

**API keys** → `semi-face-key` → **API key** → **Show**. Ese valor es `FACE_API_KEY` en el `.env` de las dos EC2. Se pasa por privado y no va en el repo ni en el README.

**(captura)** El plan de uso con su stage y su key asociados (sin mostrar el valor de la key).

## 6. Probar

Desde la compu (Git Bash), con un evento de prueba de `Proyecto/lambdas/events/`:

```bash
# Subir una foto de perfil (tiene que responder 201)
curl -X POST <UPLOAD_API>/upload/profile \
  -H "Content-Type: application/json" \
  -d '{"fileName":"prueba.jpg","contentType":"image/jpeg","imageBase64":"<base64-de-una-imagen>"}'

# Comparar caras sin la key (tiene que responder 403 Forbidden)
curl -X POST <UPLOAD_API>/face/compare -H "Content-Type: application/json" -d '{}'

# Comparar caras con la key (tiene que responder 200 o 422)
curl -X POST <UPLOAD_API>/face/compare \
  -H "Content-Type: application/json" \
  -H "x-api-key: <API-key>" \
  -d '{"sourceBase64":"<base64-de-una-cara>","targetKey":"Fotos_Perfil/<archivo>.jpg"}'
```

| Respuesta | Causa común |
|---|---|
| `{"message":"Missing Authentication Token"}` | La ruta está mal escrita o falta hacer Deploy |
| `{"message":"Forbidden"}` en `/face/compare` | Falta la key, o la key no está en el plan de uso |
| `{"message":"Internal server error"}` | La Lambda falló; revisar sus logs en CloudWatch |
| `413 Request Entity Too Large` | La imagen pesa más de 10 MB (el frontend debe reducirla antes) |
| "CORS error" en el navegador | Falta **Enable CORS** en esa ruta o falta hacer Deploy |

**(captura)** Resultado de las pruebas.
