[ ← Regresar ](../README.md)

# Configuración de IAM

Todo se hace desde la consola web de AWS con la **cuenta raíz**, en **IAM** (buscador de arriba → "IAM"). Esto va primero, porque los demás necesitan sus usuarios y roles para crear lo suyo.

Al final quedan **3 políticas propias, 3 roles y 4 usuarios**. El cuarto rol (el del Identity Pool) se crea solo en [configuracion-cognito.md](configuracion-cognito.md).

Las líneas que dicen **(captura)** son las que van al README final.

## Índice

1. [Políticas propias](#1-políticas-propias)
2. [Roles](#2-roles)
3. [Usuarios](#3-usuarios)
4. [Servicios que no necesitan configuración](#4-servicios-que-no-necesitan-configuración)

## 1. Políticas propias

Para las personas usamos las políticas *FullAccess* que ya trae AWS. Solo hay que crear estas 3, que son para las aplicaciones y para poder asignarle el rol a las EC2.

En todas, `<ID-cuenta>` es el número de 12 dígitos de la cuenta (arriba a la derecha de la consola).

Pasos para cada una:

1. **Policies** → **Create policy**.
2. En **Policy editor** cambiar de **Visual** a **JSON**.
3. Borrar lo que haya y pegar el JSON.
4. **Next**, poner el nombre y **Create policy**.

### 1.1 `G6-EC2-App`

Lo que pueden hacer los backends de las EC2: traducir (Translate y Comprehend para detectar el idioma) y leer y actualizar usuarios de Cognito.

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "Traduccion",
      "Effect": "Allow",
      "Action": ["translate:TranslateText", "comprehend:DetectDominantLanguage"],
      "Resource": "*"
    },
    {
      "Sid": "UsuariosCognito",
      "Effect": "Allow",
      "Action": ["cognito-idp:AdminGetUser", "cognito-idp:AdminUpdateUserAttributes"],
      "Resource": "arn:aws:cognito-idp:us-east-1:<ID-cuenta>:userpool/*"
    }
  ]
}
```

### 1.2 `G6-Lambda-Imagenes`

Lo que pueden hacer las Lambdas de imágenes: guardar y leer en las dos carpetas del bucket, sacar etiquetas y comparar caras.

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "BucketImagenes",
      "Effect": "Allow",
      "Action": ["s3:PutObject", "s3:GetObject"],
      "Resource": [
        "arn:aws:s3:::semi1proyecto-g6/Fotos_Perfil/*",
        "arn:aws:s3:::semi1proyecto-g6/Fotos_Publicadas/*"
      ]
    },
    {
      "Sid": "Rekognition",
      "Effect": "Allow",
      "Action": ["rekognition:DetectLabels", "rekognition:CompareFaces"],
      "Resource": "*"
    }
  ]
}
```

`s3:GetObject` hace falta porque `CompareFaces` lee la foto de perfil directo del bucket usando los permisos de la Lambda.

### 1.3 `G6-PassRole-EC2`

Sin esto, quien crea las EC2 no puede asignarles el rol `Semi-EC2-AppRole` (la lista de roles sale vacía o da error al lanzar).

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AsignarRolEC2",
      "Effect": "Allow",
      "Action": "iam:PassRole",
      "Resource": "arn:aws:iam::<ID-cuenta>:role/Semi-EC2-AppRole"
    },
    {
      "Sid": "VerPerfilesDeInstancia",
      "Effect": "Allow",
      "Action": ["iam:ListInstanceProfiles", "iam:GetInstanceProfile"],
      "Resource": "*"
    }
  ]
}
```

**(captura)** Lista de políticas filtrando por `G6-`.

## 2. Roles

Un rol es como un usuario, pero lo usa un servicio (una EC2 o una Lambda) y no una persona. Por eso las EC2 y las Lambdas no necesitan llaves de acceso.

Pasos para cada uno:

1. **Roles** → **Create role**.
2. **Trusted entity type**: AWS service. En **Use case** elegir el servicio de la tabla.
3. **Next**, buscar y marcar las políticas de la tabla.
4. **Next**, poner el nombre y **Create role**.

| Rol | Use case | Políticas | Lo usa |
|---|---|---|---|
| `Semi-EC2-AppRole` | EC2 | `G6-EC2-App` | Las dos EC2 |
| `Semi-Lambda-UploadRole` | Lambda | `AWSLambdaBasicExecutionRole`, `G6-Lambda-Imagenes` | Lambdas `upload-profile`, `upload-post` y `face-compare` |
| `Semi-LexFulfillment-Role` | Lambda | `AWSLambdaBasicExecutionRole` | Lambda `lex-facultad` del bot |

`AWSLambdaBasicExecutionRole` solo deja escribir logs en CloudWatch, que es donde se ven los errores de las Lambdas.

Cuando el use case es EC2, AWS crea también el *instance profile* con el mismo nombre, que es lo que aparece en la lista al crear la instancia.

**(captura)** Cada rol con su pestaña **Permissions**.

## 3. Usuarios

Un usuario por integrante, cada uno con permisos solo de los servicios que le tocan.

| Usuario | Integrante | Servicios | Políticas |
|---|---|---|---|
| `derek` | Derek Francisco Orellana Ibáñez | EC2 No. 1, RDS y security groups | `AmazonEC2FullAccess`, `AmazonRDSFullAccess`, `G6-PassRole-EC2` |
| `jose` | José Adrian Orozco Ramírez | EC2 No. 2 y balanceador | `AmazonEC2FullAccess`, `ElasticLoadBalancingFullAccess`, `G6-PassRole-EC2` |
| `jax` | Edwin Alexander Jax Lopez | Bucket de imágenes, Lambdas, API Gateway y Rekognition | `AmazonS3FullAccess`, `AWSLambda_FullAccess`, `AmazonAPIGatewayAdministrator`, `AmazonRekognitionReadOnlyAccess` |
| `miguel` | Miguel Angel Kanek Balan Velasco | Bucket de la página, Cognito, Lex y la Lambda del bot | `AmazonS3FullAccess`, `AmazonCognitoPowerUser`, `AmazonLexFullAccess`, `AWSLambda_FullAccess` |

Pasos para cada uno:

1. **Users** → **Create user**.
2. Poner el nombre y marcar **Provide user access to the AWS Management Console**.
3. Elegir **I want to create an IAM user**, **Custom password** y marcar **Users must create a new password at next sign-in**.
4. **Next** → **Attach policies directly** y marcar las políticas de la tabla.
5. **Next** → **Create user**.
6. Descargar el `.csv` con los datos de acceso y pasárselo a cada quien **por privado**. Nunca va en el repo ni en el README.

Cada quien entra con el **Console sign-in URL** que sale en el `.csv`.

Notas:

- `AWSLambda_FullAccess` ya trae permiso para asignar roles a las Lambdas, por eso `jax` y `miguel` no necesitan algo como `G6-PassRole-EC2`.
- `AmazonRekognitionReadOnlyAccess` es solo para probar Rekognition desde la consola; las Lambdas usan su rol.
- El Identity Pool de Cognito crea su propio rol, y eso necesita permisos de IAM que ningún usuario tiene. Ese paso se hace con la cuenta raíz (ver [configuracion-cognito.md](configuracion-cognito.md)).

**(captura)** Lista de usuarios y la pestaña **Permissions** de cada uno.

## 4. Servicios que no necesitan configuración

| Servicio | Por qué no se configura |
|---|---|
| Rekognition | Se usa directo desde las Lambdas. Solo necesita el permiso de `G6-Lambda-Imagenes`. |
| Translate | Se usa directo desde los backends. Solo necesita el permiso de `G6-EC2-App`. Para traducir con el idioma de origen en automático también hace falta Comprehend, que ya está en esa política. |
