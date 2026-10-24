[ ← Regresar ](../README.md)

# Contrato de API - Semi-Social

Este es el contrato que siguen el frontend, el backend de Node (EC2 No. 1), el de Python (EC2 No. 2) y las Lambdas. El balanceador puede mandar cualquier petición a cualquiera de los dos backends, así que los dos tienen que responder exactamente igual.

Si alguien necesita cambiar algo de aquí, lo avisa en el grupo antes y lo sube en un PR para que todos lo vean.

Los ejemplos de cada endpoint están en [examples/](examples/). El frontend también los usa para los mocks.

## 1. Formato de las respuestas

Todas las respuestas, de los backends y de las Lambdas, traen siempre estas tres llaves:

```json
{
  "status": "success",
  "message": "Publicación creada",
  "data": { }
}
```

| Llave | Qué lleva |
|---|---|
| `status` | `"success"` si todo salió bien o `"error"` si algo falló. No hay otro valor. |
| `message` | Un texto en español que se le puede mostrar al usuario. Nunca va vacío. |
| `data` | Si salió bien, lo que se pidió (objeto o lista). Si falló, un objeto con el `code` del error. |

Cuando algo falla:

```json
{
  "status": "error",
  "message": "La contraseña es incorrecta",
  "data": { "code": "INVALID_PASSWORD" }
}
```

Si el error es porque un campo viene mal, se agrega `fields` para saber cuál:

```json
{
  "status": "error",
  "message": "Datos inválidos",
  "data": { "code": "VALIDATION_ERROR", "fields": { "dpi": "Debe tener 13 dígitos" } }
}
```

En el frontend las decisiones se toman con `data.code` y no con el texto de `message`, porque el texto lo podemos cambiar cuando queramos.

### Códigos HTTP

Aunque el cuerpo ya trae `status`, igual hay que devolver el código HTTP correcto:

| HTTP | Cuándo |
|---|---|
| 200 | Se leyó o actualizó algo |
| 201 | Se creó algo (registro, publicación, comentario, solicitud, imagen) |
| 400 | `VALIDATION_ERROR`, `UNSUPPORTED_MEDIA_TYPE` |
| 401 | `UNAUTHORIZED`, `TOKEN_EXPIRED`, `INVALID_CREDENTIALS`, `FACE_NOT_MATCHED` |
| 403 | `FORBIDDEN`, `NOT_FRIENDS`, `INVALID_PASSWORD` (al editar perfil), `EMAIL_NOT_VERIFIED` |
| 404 | `NOT_FOUND` |
| 409 | `ALREADY_EXISTS`, `REQUEST_ALREADY_EXISTS`, `ALREADY_FRIENDS` |
| 413 | `IMAGE_TOO_LARGE` |
| 422 | `NO_FACE_DETECTED` |
| 500 | `INTERNAL_ERROR` (sin mandar el error de SQL ni el stack) |
| 502 | `UPSTREAM_ERROR` (falló Translate, la Lambda, Cognito, etc.) |

### Lista de códigos de error

| Código | Qué pasó |
|---|---|
| `VALIDATION_ERROR` | Falta un campo o viene mal (ver `data.fields`) |
| `UNAUTHORIZED` | No mandó token o no es válido |
| `TOKEN_EXPIRED` | El token ya venció |
| `INVALID_CREDENTIALS` | Usuario o contraseña incorrectos |
| `INVALID_PASSWORD` | Contraseña incorrecta al editar el perfil |
| `EMAIL_NOT_VERIFIED` | Todavía no confirmó el correo en Cognito |
| `FACE_NOT_MATCHED` | La cara no coincide con la foto de perfil |
| `NO_FACE_DETECTED` | No se encontró ninguna cara en la foto |
| `ALREADY_EXISTS` | El usuario, correo o DPI ya está registrado |
| `NOT_FOUND` | No existe lo que se buscó |
| `FORBIDDEN` | No tiene permiso para hacer eso |
| `NOT_FRIENDS` | Solo se puede hacer entre amigos |
| `REQUEST_ALREADY_EXISTS` | Ya hay una solicitud pendiente entre los dos |
| `ALREADY_FRIENDS` | Ya son amigos |
| `IMAGE_TOO_LARGE` | La imagen pesa demasiado |
| `UNSUPPORTED_MEDIA_TYPE` | El archivo no es JPG ni PNG |
| `UPSTREAM_ERROR` | Falló un servicio de AWS |
| `INTERNAL_ERROR` | Cualquier otro error del servidor |

### Errores que no vienen con este formato

Hay errores que no salen de nuestro código y por eso no traen `status`, `message` y `data`. El `ApiClient` del frontend los convierte al mismo formato:

- API Gateway responde cosas como `{"message": "Forbidden"}` (403), 413, 429 o 504.
- El balanceador responde una página HTML cuando da 502, 503 o 504.
- Si no hay internet o no hubo respuesta, se usa `code: "NETWORK_ERROR"`.

## 2. Reglas generales

| Tema | Regla |
|---|---|
| Puerto | `5000` en las dos EC2. |
| Health check | `GET /api/health` responde `200`. Es la ruta que usa el Target Group. |
| Prefijo | Todas las rutas empiezan con `/api`, incluido el health check. |
| Nombres de campos | En inglés y camelCase (`fullName`, `photoUrl`, `createdAt`). Las tablas pueden estar en español, el backend hace el cambio. |
| IDs | Números (`3`), no texto. |
| Fechas | UTC con `Z` y sin milisegundos: `"2026-10-24T15:30:00Z"`. Hay que formatearlas a mano en los dos backends, porque Node por defecto pone `.000Z` y Python no pone la `Z`. La conexión a MySQL se deja en UTC. |
| Booleanos | `true` o `false`. MySQL devuelve `0` o `1`, así que hay que convertirlos. |
| Campos vacíos | Si un campo opcional no tiene valor va `null`, no `""`. Las listas vacías van como `[]`. |
| Imágenes | Se mandan a las Lambdas en base64 sin el `data:image/...;base64,` del inicio. El frontend las reduce a 1.5 MB como máximo antes de mandarlas. Solo JPG y PNG. |
| Idiomas para traducir | `es`, `en`, `fr`, `pt`. |
| Contraseñas | En RDS se guardan con MD5 (lo pide la rúbrica). Nunca se devuelven en una respuesta. |
| CORS | Abierto (`*`) en los dos backends y en API Gateway. |

## 3. Autenticación

- Las rutas protegidas llevan el header `Authorization: Bearer <token>`.
- El token es un JWT HS256 firmado con `JWT_SECRET`, que tiene el mismo valor en las dos EC2. Así un token que sacó Node sirve en Python y al revés.
- Lleva estos datos:

```json
{ "sub": "3", "username": "ana", "iat": 1761319800, "exp": 1761348600 }
```

- `sub` es el id del usuario como texto. Tiene que ser texto porque la librería de JWT de Python rechaza el token si `sub` es número.
- Dura 8 horas (`JWT_HOURS`).
- En el chat el navegador no deja mandar headers por WebSocket, así que el token va en la URL: `/api/ws?token=<token>`.

## 4. URLs que usa el frontend

| Variable | A dónde apunta |
|---|---|
| `API_BASE` | DNS del balanceador |
| `UPLOAD_API` | URL del stage de API Gateway |

## 5. Endpoints

El dueño es el integrante que lo programa en Node y en Python según el plan de división.

### Backends (por el balanceador)

| Dueño | Método y ruta | Necesita token | Responde | Ejemplo |
|---|---|---|---|---|
| 1 y 2 | `GET /api/health` | No | 200 | [health.json](examples/api/health.json) |
| 1 | `POST /api/auth/register` | No | 201 | [auth.json](examples/auth.json) |
| 1 | `POST /api/auth/session` | No | 200 | [auth.json](examples/auth.json) |
| 1 | `POST /api/auth/face-session` | No | 200 | [auth.json](examples/auth.json) |
| 1 | `GET /api/users/me` | Sí | 200 | [users.json](examples/users.json) |
| 1 | `PUT /api/users/me` | Sí | 200 | [users.json](examples/users.json) |
| 1 | `GET /api/users/discover?q=` | Sí | 200 | [users.json](examples/users.json) |
| 1 | `POST /api/friends/requests` | Sí | 201 | [friends.json](examples/friends.json) |
| 1 | `GET /api/friends/requests` | Sí | 200 | [friends.json](examples/friends.json) |
| 1 | `PUT /api/friends/requests/{id}` | Sí | 200 | [friends.json](examples/friends.json) |
| 1 | `GET /api/friends` | Sí | 200 | [friends.json](examples/friends.json) |
| 1 | `GET /api/posts/{id}/comments` | Sí | 200 | [comments.json](examples/comments.json) |
| 1 | `POST /api/posts/{id}/comments` | Sí | 201 | [comments.json](examples/comments.json) |
| 2 | `GET /api/posts?tag=` | Sí | 200 | [posts.json](examples/posts.json) |
| 2 | `POST /api/posts` | Sí | 201 | [posts.json](examples/posts.json) |
| 2 | `GET /api/tags?q=` | Sí | 200 | [posts.json](examples/posts.json) |
| 2 | `POST /api/translate` | Sí | 200 | [translate.json](examples/translate.json) |
| 2 | `GET /api/chat/{friendId}/messages` | Sí | 200 | [chat.json](examples/chat.json) |
| 2 | `WS /api/ws?token=` | Sí (en la URL) | - | [chat.json](examples/chat.json) |

### Lambdas (por API Gateway)

| Dueño | Método y ruta | Necesita | Responde | Ejemplo |
|---|---|---|---|---|
| 3 | `POST /upload/profile` | Nada (se usa en el registro) | 201 | [upload.json](examples/upload.json) |
| 3 | `POST /upload/post` | Nada | 201 | [upload.json](examples/upload.json) |
| 3 | `POST /face/compare` | Header `x-api-key` | 200 | [upload.json](examples/upload.json) |

`/face/compare` solo lo llama el backend, nunca el navegador. La API key se pide únicamente en esa ruta; si se activa en todo el stage, las subidas del frontend dejan de funcionar.

Las Lambdas devuelven `{ statusCode, headers, body }`, donde `headers` trae los de CORS y `body` es el JSON de arriba convertido a texto.

### Lex

El frontend habla directo con Lex usando el Identity Pool de Cognito, así que no pasa por estos endpoints.

## 6. Cómo funciona cada cosa

Esto es lo que los dos backends tienen que hacer igual:

- **Feed** (`GET /api/posts`): mis publicaciones y las de mis amigos, de la más nueva a la más vieja. Si viene `tag`, solo las que tienen esa etiqueta. Sin `tag` es el filtro "Todos".
- **Etiquetas** (`GET /api/tags`): las etiquetas de las publicaciones del feed, en orden alfabético. `q` busca por parte del nombre sin importar mayúsculas.
- **Comentarios**: solo pueden comentar el autor y sus amigos (si no, `403 NOT_FRIENDS`). Se listan del más viejo al más nuevo.
- **Descubrir usuarios**: todos los que no son mis amigos, sin contarme a mí.
- **Registro**: el frontend sube la foto, hace el registro en Cognito y luego llama a `/api/auth/register`. El backend revisa en Cognito que el usuario exista y lo guarda en RDS con la contraseña en MD5.
- **Editar perfil**: el backend revisa la contraseña con el MD5 de RDS. Si está bien actualiza RDS y después Cognito. Si está mal no cambia nada. Lo hace el backend y no el frontend porque quien entró con login facial no tiene sesión de Cognito en el navegador.
- **Chat**: el mensaje se guarda en RDS. Cada EC2 revisa cada 1 o 2 segundos si hay mensajes nuevos y se los manda a los dos usuarios del chat que estén conectados a ella. Así funciona aunque cada usuario esté en una EC2 distinta. Como un mensaje puede llegar dos veces, el frontend descarta los repetidos por `id`. Se manda un ping cada 30 segundos porque el balanceador corta las conexiones que pasan 60 segundos sin actividad.
