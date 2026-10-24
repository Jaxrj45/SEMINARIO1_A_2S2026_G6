[ ← Regresar ](../README.md)

# Configuración de los buckets de S3

Todo se hace desde la consola web de AWS, en la región **us-east-1**. Son dos buckets:

| Bucket | Para qué |
|---|---|
| `semi1proyecto-g6` | Fotos de perfil y de las publicaciones |
| `proyecto-web-g6` | La página web (el enunciado dice `Proyecto-Web-G6`, pero S3 no acepta mayúsculas) |

Las líneas que dicen **(captura)** son las que van al README final.

## Índice

1. [Bucket de imágenes](#1-bucket-de-imágenes)
2. [Bucket de la página web](#2-bucket-de-la-página-web)
3. [Subir la página](#3-subir-la-página)

## 1. Bucket de imágenes

### 1.1 Crear el bucket

**S3** → **Create bucket**.

| Campo | Valor |
|---|---|
| Bucket type | General purpose |
| Bucket name | `semi1proyecto-g6` |
| Object Ownership | ACLs disabled (recommended) |
| Block all public access | **Desmarcar** y marcar la casilla de confirmación de abajo |
| Lo demás | Como viene |

### 1.2 Crear las carpetas

Entrar al bucket → **Create folder** → `Fotos_Perfil` → **Create folder**. Repetir con `Fotos_Publicadas`.

Los nombres tienen que ser exactos, con mayúsculas y guion bajo, porque así los pide la rúbrica.

### 1.3 Hacer públicas las dos carpetas

Bucket → **Permissions** → **Bucket policy** → **Edit**, pegar esto y **Save changes**:

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
        "arn:aws:s3:::semi1proyecto-g6/Fotos_Perfil/*",
        "arn:aws:s3:::semi1proyecto-g6/Fotos_Publicadas/*"
      ]
    }
  ]
}
```

Con esto cualquiera puede **ver** las fotos, pero solo las Lambdas pueden **subir**.

Como el bucket tiene las ACLs desactivadas, las Lambdas no deben mandar `ACL: 'public-read'` al subir, porque S3 rechaza la subida. Lo público ya lo da esta política.

### 1.4 Probar

Subir una imagen a mano a `Fotos_Perfil`, abrirla y copiar su **Object URL** en una ventana de incógnito. Si se ve la imagen, quedó bien. Después se puede borrar.

**(captura)** El bucket con las dos carpetas y la pestaña **Permissions** con la política.

## 2. Bucket de la página web

### 2.1 Crear el bucket

Igual que el anterior, pero con el nombre `proyecto-web-g6` (también desmarcando **Block all public access**).

### 2.2 Activar el hosting estático

Bucket → **Properties** → hasta abajo, **Static website hosting** → **Edit**.

| Campo | Valor |
|---|---|
| Static website hosting | Enable |
| Hosting type | Host a static website |
| Index document | `index.html` |
| Error document | `index.html` |

El error document también es `index.html` porque React maneja sus propias rutas. Si no, al recargar la página estando en `/perfil` sale un 404 de S3.

Al guardar, en esa misma sección aparece el **Bucket website endpoint**, algo como `http://proyecto-web-g6.s3-website-us-east-1.amazonaws.com`. Esa es la URL de la página.

### 2.3 Hacerlo público

Bucket → **Permissions** → **Bucket policy** → **Edit**:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "LecturaPublicaWeb",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::proyecto-web-g6/*"
    }
  ]
}
```

**(captura)** La sección **Static website hosting** con el endpoint y la política del bucket.

## 3. Subir la página

1. En `Proyecto/frontend`, poner las URLs reales (balanceador, API Gateway, Cognito y Lex) y correr `npm run build`.
2. Bucket `proyecto-web-g6` → **Upload** → **Add files** y **Add folder** con **todo lo que está dentro** de `dist/` (no la carpeta `dist` en sí). `index.html` tiene que quedar en la raíz del bucket.
3. **Upload**.

Para actualizar, se borra lo que había en el bucket y se suben los archivos nuevos.

Si después de subir se sigue viendo la versión vieja, recargar con `Ctrl + Shift + R`.

**(captura)** La página abierta desde el endpoint del bucket.
