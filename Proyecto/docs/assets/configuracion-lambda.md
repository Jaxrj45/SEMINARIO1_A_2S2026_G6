[ ← Regresar ](../../README.md)

# Configuración de las funciones Lambda

Todo se hace desde la consola web de AWS, en la región **us-east-1**. Antes hay que tener:

- El rol `Semi-Lambda-UploadRole` ([configuracion-iam.md](configuracion-iam.md)).
- El bucket `semi1proyecto-g6` con sus dos carpetas ([configuracion-s3.md](configuracion-s3.md)).

La Lambda del bot de Lex se configura en [configuracion-lex.md](configuracion-lex.md).

Las líneas que dicen **(captura)** son las que van al README final.

## Índice

1. [Funciones](#1-funciones)
2. [Crear cada función](#2-crear-cada-función)
3. [Probar](#3-probar)
4. [Ver errores](#4-ver-errores)

## 1. Funciones

| Función | Qué hace | Timeout | Memoria |
|---|---|---|---|
| `upload-profile` | Guarda la foto de perfil en `Fotos_Perfil` | 15 s | 256 MB |
| `upload-post` | Guarda la foto en `Fotos_Publicadas` y saca sus etiquetas con Rekognition | 30 s | 256 MB |
| `face-compare` | Compara la foto de la cámara con la foto de perfil usando Rekognition | 30 s | 256 MB |

Las tres usan **Node.js 22.x** y el rol `Semi-Lambda-UploadRole`. El código está en `Proyecto/lambdas/<nombre-de-la-funcion>/index.mjs`.

El timeout es más alto que los 3 segundos que trae por defecto porque Rekognition a veces tarda más que eso, y entonces la Lambda se corta a medias.

### Variables de entorno

| Función | Variable | Valor |
|---|---|---|
| `upload-profile` | `BUCKET_NAME` | `semi1proyecto-g6` |
| | `FOLDER` | `Fotos_Perfil` |
| | `MAX_BYTES` | `1572864` (1.5 MB) |
| `upload-post` | `BUCKET_NAME` | `semi1proyecto-g6` |
| | `FOLDER` | `Fotos_Publicadas` |
| | `MAX_BYTES` | `1572864` |
| | `MAX_LABELS` | `10` |
| | `MIN_CONFIDENCE` | `80` |
| `face-compare` | `BUCKET_NAME` | `semi1proyecto-g6` |
| | `SIMILARITY_THRESHOLD` | `90` |

## 2. Crear cada función

Repetir para las tres.

### 2.1 Crear

**Lambda** → **Create function**.

| Campo | Valor |
|---|---|
| Opción | Author from scratch |
| Function name | El de la tabla |
| Runtime | Node.js 22.x |
| Architecture | x86_64 |
| Change default execution role | **Use an existing role** → `Semi-Lambda-UploadRole` |

**Create function**.

### 2.2 Código

1. En la pestaña **Code**, abrir el archivo del editor y cambiarle el nombre a `index.mjs` si viene como `index.js`.
2. Borrar lo que trae y pegar el contenido de `Proyecto/lambdas/<nombre>/index.mjs`.
3. **Deploy**.

El SDK de AWS (v3) ya viene incluido en Node.js 22.x, así que no hay que subir `node_modules`.

En **Runtime settings** el handler tiene que ser `index.handler`.

### 2.3 Timeout y memoria

**Configuration** → **General configuration** → **Edit**, poner el timeout y la memoria de la tabla → **Save**.

### 2.4 Variables de entorno

**Configuration** → **Environment variables** → **Edit** → **Add environment variable** por cada una de la tabla → **Save**.

**(captura)** Cada función con su código, su configuración general y sus variables de entorno.

## 3. Probar

Antes de conectarlas a API Gateway se pueden probar solas.

1. Pestaña **Test** → **Create new event**.
2. Nombre del evento y pegar el JSON de `Proyecto/lambdas/events/<nombre>.json`.
3. **Save** → **Test**.

El evento tiene la misma forma que manda API Gateway: el JSON de la petición va como texto dentro de `body`.

La respuesta tiene que tener `statusCode` 200 o 201 y en `body` el formato del [contrato](../../contracts/README.md) (`status`, `message` y `data`). En el caso de `upload-profile` y `upload-post`, la imagen tiene que aparecer en su carpeta del bucket.

**(captura)** Resultado de cada prueba y las imágenes en el bucket.

## 4. Ver errores

Si una prueba falla: pestaña **Monitor** → **View CloudWatch logs** → el log más reciente.

| Error | Causa común |
|---|---|
| `Task timed out after 3.00 seconds` | No se cambió el timeout |
| `AccessDenied` en S3 | El rol no tiene `G6-Lambda-Imagenes` o la carpeta tiene otro nombre |
| `AccessControlListNotSupported` | El código manda `ACL: 'public-read'` y el bucket tiene las ACLs desactivadas |
| `InvalidParameterException` en `CompareFaces` | La foto no tiene ninguna cara. La función debe responder `NO_FACE_DETECTED` |
| `Cannot find module` | El archivo no se llama `index.mjs` o el handler no es `index.handler` |
