[ ← Regresar ](../../README.md)

# Configuración de Cognito

Todo se hace desde la consola web de AWS, en la región **us-east-1**. Son dos cosas distintas:

| Recurso | Para qué |
|---|---|
| User Pool | Registro, verificación por correo e inicio de sesión de los usuarios |
| Identity Pool | Dar permisos temporales al navegador para hablar con el bot de Lex sin iniciar sesión |

Las líneas que dicen **(captura)** son las que van al README final.

## Índice

1. [User Pool](#1-user-pool)
2. [Atributo DPI](#2-atributo-dpi)
3. [Verificación por correo](#3-verificación-por-correo)
4. [App client](#4-app-client)
5. [Identity Pool](#5-identity-pool)
6. [Datos para el frontend y los backends](#6-datos-para-el-frontend-y-los-backends)

## 1. User Pool

**Cognito** → **User pools** → **Create user pool**.

| Campo | Valor |
|---|---|
| Application type | Single-page application (SPA) |
| Name your application | `semisocial-web` |
| Options for sign-in identifiers | **Username** |
| Self-registration | Enable self-registration |
| Required attributes for sign-up | `email` y `name` |
| Return URL | Vacío (no usamos la página de login de Cognito) |

**Create user directory**.

Con **Single-page application** el app client se crea **sin client secret**, que es lo que necesita la librería del frontend (`amazon-cognito-identity-js` no funciona con secret).

El username no se puede cambiar después y no distingue mayúsculas (`Ana` y `ana` son el mismo).

**(captura)** La página principal del User Pool con su ID.

## 2. Atributo DPI

Cognito no trae un campo de DPI, así que se crea uno propio. Esto solo se puede hacer después de crear el pool.

User Pool → **Sign-up** → **Custom attributes** → **Add custom attributes**.

| Campo | Valor |
|---|---|
| Name | `dpi` |
| Type | String |
| Min length | 13 |
| Max length | 13 |
| Mutable | Marcado (para poder cambiarlo al editar el perfil) |

**Save changes**. En el código se usa como `custom:dpi`.

Los atributos propios no se pueden borrar después, así que hay que revisar bien antes de guardar.

**(captura)** La lista de atributos con `custom:dpi`.

## 3. Verificación por correo

### 3.1 Revisar que esté activa

User Pool → **Sign-up** → **Attribute verification and user account confirmation**. Tiene que estar:

| Campo | Valor |
|---|---|
| Cognito-assisted verification and confirmation | Activado |
| Attributes to verify | Send email message, verify email address |

### 3.2 Mensaje en español

User Pool → **Messaging** → **Message templates** → **Verification message** → **Edit**.

| Campo | Valor |
|---|---|
| Verification type | Code |
| Email subject | `Código de verificación de Semi-Social` |
| Email message | `Hola, tu código para activar tu cuenta de Semi-Social es {####}` |

El `{####}` tiene que quedar tal cual, porque ahí Cognito pone el código.

### 3.3 Envío de correos

En **Messaging** → **Email** se deja **Send email with Cognito**. Tiene un límite de unos 50 correos al día, que alcanza para probar y para la calificación. Si llega a fallar el envío, se puede confirmar un usuario a mano desde **Users** → usuario → **Actions** → **Confirm account**.

Los correos de Cognito a veces caen en spam.

### 3.4 Política de contraseñas

En **Authentication** → **Authentication methods** → **Password policy** se ve qué pide la contraseña (por defecto: mínimo 8 caracteres, mayúscula, minúscula, número y símbolo). El frontend tiene que validar lo mismo para mostrar un mensaje claro antes de mandar el registro.

**(captura)** La configuración de verificación y el mensaje del correo.

## 4. App client

User Pool → **App clients** → `semisocial-web`.

Revisar que:

| Campo | Valor |
|---|---|
| Client secret | Ninguno |
| Authentication flows | `ALLOW_USER_SRP_AUTH` y `ALLOW_REFRESH_TOKEN_AUTH` |

Si falta alguno, **Edit** y marcarlo.

En la pestaña **Attribute permissions**, `name`, `email` y `custom:dpi` tienen que estar marcados en lectura y escritura.

**(captura)** El app client con sus flujos de autenticación.

## 5. Identity Pool

Esto se hace con la **cuenta raíz**, porque el asistente crea un rol de IAM y ningún usuario del grupo tiene ese permiso.

### 5.1 Crear

**Cognito** → **Identity pools** → **Create identity pool**.

| Campo | Valor |
|---|---|
| User access | Solo **Guest access** |
| Guest role | Create a new IAM role → `Semi-Identity-Unauth-Role` |
| Identity pool name | `semisocial_identity_pool` |
| Basic (classic) authentication | Desactivado |

**Create identity pool**.

### 5.2 Darle permiso para hablar con Lex

Esto se hace después de crear el bot y su alias ([configuracion-lex.md](configuracion-lex.md)), porque hace falta el ARN del alias.

**IAM** → **Roles** → `Semi-Identity-Unauth-Role` → **Add permissions** → **Create inline policy** → **JSON**:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "HablarConElBot",
      "Effect": "Allow",
      "Action": "lex:RecognizeText",
      "Resource": "arn:aws:lex:us-east-1:<ID-cuenta>:bot-alias/<ID-del-bot>/<ID-del-alias>"
    }
  ]
}
```

Nombre: `G6-Lex-Visitantes` → **Create policy**.

Así, alguien que entra a la página solo puede mandarle mensajes al bot y nada más.

**(captura)** El Identity Pool y la política del rol.

## 6. Datos para el frontend y los backends

| Dato | Dónde se ve | Lo usa |
|---|---|---|
| User Pool ID | User Pool → **Overview** | Frontend y backends (`COGNITO_USER_POOL_ID`) |
| Client ID | **App clients** → `semisocial-web` | Frontend y backends (`COGNITO_CLIENT_ID`) |
| Identity Pool ID | Identity pool → **Overview** | Frontend (para Lex) |
| Región | `us-east-1` | Todos |

Se pasan por el chat privado del grupo y van en los `.env`, no en el repo.

### Limpiar antes de la calificación

Para empezar la demo desde cero: User Pool → **Users** → marcar los usuarios de prueba → **Delete user**. También hay que borrarlos de la tabla `usuarios` de la RDS, para que no queden datos que no coinciden entre Cognito y la base.
