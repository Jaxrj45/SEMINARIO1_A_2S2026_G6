# Guía de Persona 4 (José Adrian): Serverless + README final

Guía paso a paso para alguien que **nunca ha usado AWS ni Azure**. Todo se hace desde la consola web, salvo un despliegue desde VS Code.

- Código listo: [`aws-lambda/`](aws-lambda/) y [`azure-functions/`](azure-functions/).
- Rúbrica (enunciado págs. 13-14): Serverless 9 · Diagrama AWS 7 · Diagrama Azure 8 · Entregables 11 · Requisitos 13 · Manual técnico 11-12.

---

## 0. Qué es lo tuyo y por qué existe

El frontend (estático, en S3/Blob) no puede escribir en un bucket por sí solo. Para subir una imagen o un texto tiene dos caminos:

- **Modo A:** subir el archivo al backend (Node/Python en EC2/VM), que lo manda al bucket.
- **Modo B (el tuyo):** subirlo a una **función serverless**, que lo guarda en el bucket y devuelve la URL. El frontend registra esa URL en el backend (`POST /api/files`).

"Serverless" significa que subes solo el código de una función y la nube la ejecuta cuando alguien la llama. No administras ningún servidor.

```
Frontend --POST JSON--> API Gateway --> Lambda --> S3 (images/ o texts/)       (AWS)
Frontend --POST JSON--> API Management --> Azure Function --> Blob (images/ o texts/)  (Azure)
                                   respuesta: { url, name, type }
```

Por qué hay dos piezas por nube: la **función** tiene el código, pero no tiene una URL pública cómoda. La **puerta de entrada** (API Gateway en AWS, API Management en Azure) le da una URL por ruta, maneja CORS y es lo que el enunciado exige ("rutas en los servicios de APIs").

### Lo que hacen las 4 funciones
| Función | Ruta | Acepta | Guarda como |
|---|---|---|---|
| Subir imagen | `POST /imagenes` | `contentType` que empiece con `image/` | `images/<uuid><ext>` |
| Subir texto | `POST /textos` | `contentType` que empiece con `text/` | `texts/<uuid><ext>` |

Entrada (JSON): `{ "name": "foto.png", "contentType": "image/png", "data": "<base64>" }`
Salida `201`: `{ "url": "https://...", "name": "foto.png", "type": "image" }` (o `"text"`).
Errores: `400` si el JSON o el tipo son inválidos, `500` si falla el bucket.

### Por qué JSON con base64
Es lo más simple de pasar por API Gateway y APIM, sin manejar multipart. Limita el tamaño (las funciones ponen 4 MB; el base64 pesa 33 % más; API Gateway HTTP API permite hasta 10 MB, Lambda 6 MB). Para fotos de perfil y notas de texto alcanza.

---

## 1. Qué necesitas de cada compañero

| De quién | Qué | Para qué paso | Cuándo lo pide la guía |
|---|---|---|---|
| Persona 1 (Derek) | Credenciales `g6-lambda` y `g6-apigateway` (.csv) | Pasos 3 y 4 | Escenario B |
| Persona 1 | Un **rol de ejecución** de Lambda con `s3:PutObject` sobre el bucket de archivos (o `iam:PassRole` para `g6-lambda`) | Paso 3 | Escenario B |
| Persona 3 (Miguel) | Nombre del **bucket S3 de archivos** | Pasos 3, 4 | Escenario B |
| Persona 3 | Bucket con **objetos públicos** y **CORS** (`GET`) | Pasos 3-4 (prueba) | Escenario B |
| Persona 3 | Nombre de la **cuenta de almacenamiento** y el **contenedor de archivos** de Azure, con acceso público de lectura y CORS | Paso 5-6 | Escenario B |
| Todos | Su sección del README con capturas | Paso 9 | Al final |
| A quién le das | Las **4 URLs** a Persona 3 | Paso 7 | Antes de compilar el frontend |

Mensaje listo para mandar al grupo:

> Necesito: (1) nombre exacto del bucket S3 de archivos, (2) credenciales de g6-lambda y g6-apigateway, (3) un rol de ejecución de Lambda con s3:PutObject sobre ese bucket (o iam:PassRole para g6-lambda). De Azure: cuenta de almacenamiento y contenedor de archivos, con acceso público de lectura y CORS. Yo les doy a Miguel las 4 URLs de las rutas serverless.

---

## 2. Dos formas de trabajar

### Escenario A: todavía no tienes nada de tus compañeros
No te quedes esperando. Haz esto con tu propia cuenta y recursos de prueba, y al final repites con los recursos del grupo:

1. **Azure primero** (es lo que más tarda y vale más: 40 pts): crea tu Resource Group, una Storage Account de prueba con un contenedor público, la Function App y la API Management (Paso 5-6). APIM tarda de 30 a 40 minutos en crearse en el tier Developer; déjala creándose y sigue.
2. **AWS de prueba** (opcional, si tienes cuenta personal): un bucket público de prueba, las 2 Lambdas y un API Gateway (Pasos 3-4), con el rol básico que AWS crea solo. Sirve para aprender y validar el código.
3. **Escribe tu documentación** mientras aprendes (Paso 9): captura todo lo que hagas.
4. Cuando lleguen los recursos reales, cambia **solo** estas variables: `S3_BUCKET` en las Lambdas, `AZURE_STORAGE_CONNECTION_STRING` y `AZURE_STORAGE_CONTAINER` en la Function App. El código no cambia.

> Para la entrega final, las capturas de AWS deben ser con los **usuarios IAM del grupo** (`g6-lambda`, `g6-apigateway`), no con tu cuenta personal.

### Escenario B: ya tienes todo
Sigue la guía de corrido, Pasos 3 a 10.

---

## 3. AWS: las 2 Lambdas

Usuario: `g6-lambda`. Región: **us-east-1 (N. Virginia)** (confirma abajo a la derecha del nombre de la región).

### 3.1 Entrar
1. Abre la URL de inicio de sesión del .csv (`https://<numero>.signin.aws.amazon.com/console`), con usuario y contraseña temporal. Te pedirá una nueva.
2. Arriba a la derecha selecciona **US East (N. Virginia)**.

### 3.2 Crear `g6-subir-imagen`
1. Buscador → **Lambda** → **Create function** → **Author from scratch**.
2. *Function name:* `g6-subir-imagen`. *Runtime:* **Node.js 22.x**. *Architecture:* x86_64.
3. *Permissions* → **Change default execution role** → **Use an existing role** → elige el rol que te dio Derek. Si aún no existe, deja *Create a new role with basic Lambda permissions* y arregla los permisos después (3.5).
4. **Create function**.
5. Pestaña **Code** → abre `index.mjs` → borra todo y pega el contenido de [`aws-lambda/subir-imagen.mjs`](aws-lambda/subir-imagen.mjs) → **Deploy**.
6. **Configuration** → **General configuration** → **Edit** → *Timeout* `15 sec` → **Save**.
7. **Configuration** → **Environment variables** → **Edit** → **Add**: `S3_BUCKET` = nombre del bucket de archivos → **Save**.

> Por qué la variable: así el mismo código funciona con cualquier bucket y no se escribe el nombre dentro del código.

### 3.3 Crear `g6-subir-texto`
Igual, pero con nombre `g6-subir-texto` y el código de [`aws-lambda/subir-texto.mjs`](aws-lambda/subir-texto.mjs). Mismo timeout, misma variable `S3_BUCKET`, mismo rol.

### 3.4 Probar cada Lambda
En la pestaña **Test** → *Create new event* → pega y pulsa **Test**.

Imagen (1 píxel):
```json
{ "body": "{\"name\":\"prueba.png\",\"contentType\":\"image/png\",\"data\":\"iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==\"}" }
```
Texto:
```json
{ "body": "{\"name\":\"nota.txt\",\"contentType\":\"text/plain\",\"data\":\"SG9sYSBtdW5kbw==\"}" }
```
Resultado esperado: `statusCode: 201` y una `url`. Ábrela en el navegador.

| Síntoma | Causa |
|---|---|
| `AccessDenied` dentro del Test | Falta `s3:PutObject` en el rol (3.5) |
| La URL da `AccessDenied` en el navegador | El bucket/objetos no son públicos (Persona 3) |
| `Cannot find package '@aws-sdk/client-s3'` | El runtime no es Node.js 18+/22 |
| `Task timed out` | Sube el timeout o revisa el nombre del bucket |

### 3.5 El permiso del rol (si te toca arreglarlo)
El rol de ejecución necesita esta política (ajusta el bucket). La crea quien tenga IAM (Derek):
```json
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Action": ["s3:PutObject"],
    "Resource": "arn:aws:s3:::practica2semi1a2s2026archivosg6/*"
  }]
}
```
Por qué el rol y no tu usuario: la Lambda se ejecuta con su propio rol; tu usuario `g6-lambda` solo administra Lambda.

**Capturas:** lista de funciones · código de cada una · variables de entorno · rol (Permissions) · resultado del Test.

---

## 4. AWS: API Gateway

Usuario: `g6-apigateway` (cierra sesión y entra con él; por rúbrica cada servicio lo maneja su usuario).

### 4.1 Crear la API
1. Buscador → **API Gateway** → **Create API** → **HTTP API** → **Build**.
2. **Add integration** → *Lambda* → región us-east-1 → función `g6-subir-imagen`. Añade una segunda integración con `g6-subir-texto`.
3. *API name:* `g6-serverless-api` → **Next**.
4. **Configure routes** (cambia los que pone por defecto):
   - Método `POST`, ruta `/imagenes` → integración `g6-subir-imagen`.
   - Método `POST`, ruta `/textos` → integración `g6-subir-texto`.
5. **Next** → stage `$default` con *Auto-deploy* activado → **Next** → **Create**.

> Por qué HTTP API y no REST API: es más simple, más barata y con CORS integrado. Cumple con "una ruta por función".

> Si `g6-apigateway` no puede ver las Lambdas al elegir la integración, falta el permiso `lambda:ListFunctions`. Pídeselo a Derek, o crea la integración con el ARN de la Lambda a mano.

### 4.2 CORS (obligatorio, el frontend está en otro dominio)
1. En la API → **CORS** → **Configure**.
2. *Access-Control-Allow-Origin:* `*` (o la URL del sitio S3 si quieres cerrarlo). *Allow-Methods:* `POST`, `OPTIONS`. *Allow-Headers:* `content-type`. → **Save**.

### 4.3 La URL
En **Stages** → `$default` aparece **Invoke URL**, por ejemplo `https://abc123.execute-api.us-east-1.amazonaws.com`. Tus dos URLs son:

- `https://abc123.execute-api.us-east-1.amazonaws.com/imagenes`
- `https://abc123.execute-api.us-east-1.amazonaws.com/textos`

### 4.4 Probar desde tu computadora
```bash
curl -X POST "https://abc123.execute-api.us-east-1.amazonaws.com/textos" \
  -H "Content-Type: application/json" \
  -d '{"name":"nota.txt","contentType":"text/plain","data":"SG9sYSBtdW5kbw=="}'
```
Debe regresar `{"url":"https://...","name":"nota.txt","type":"text"}`. Abre la `url`.

**Capturas:** lista de rutas (Routes) con las integraciones · CORS · Invoke URL · respuesta del curl/Postman.

---

## 5. Azure: Storage de prueba, Function App y código

> Si Persona 3 ya creó la cuenta de almacenamiento y el contenedor de archivos, **sáltate 5.1** y usa los suyos.

Todo en `portal.azure.com`. Crea un **Resource Group** (por ejemplo `rg-g6-serverless`) para agrupar tus recursos.

### 5.1 (Solo en el Escenario A) Storage de prueba
1. **Storage accounts** → **Create** → mismo Resource Group → nombre único en minúsculas (`g6serverlesstest`) → *Redundancy* LRS → **Review + create**.
2. En la cuenta: **Settings → Configuration → Allow Blob anonymous access: Enabled**.
3. **Containers** → **+ Container** → nombre `archivos` → *Anonymous access level:* **Blob (anonymous read access for blobs only)**.
4. **Resource sharing (CORS)** → pestaña Blob service → agrega: origen `*`, métodos `GET`, headers `*`, max age `3600`.

### 5.2 Cadena de conexión
Cuenta de almacenamiento → **Security + networking → Access keys** → *Connection string* → **Show** → copia. Es un secreto: **no va al repositorio**.

### 5.3 Crear la Function App
1. **Function App** → **Create** → plan **Consumption** (o *Flex Consumption*, el que te deje la suscripción).
2. *Runtime stack:* **Node.js**, versión 22 (o 20), sistema operativo Linux, misma región que el storage.
3. En *Storage* puedes reutilizar la cuenta que ya hay. → **Review + create**.

### 5.4 Variables de entorno
Function App → **Settings → Environment variables** → **App settings** → agrega:
- `AZURE_STORAGE_CONNECTION_STRING` = la cadena de 5.2
- `AZURE_STORAGE_CONTAINER` = nombre del contenedor de archivos

→ **Apply** (reinicia la app).

### 5.5 Desplegar el código ([`azure-functions/`](azure-functions/))
**Opción recomendada, VS Code:**
1. Instala la extensión **Azure Functions** y el Node.js 20/22 en tu PC.
2. En una terminal: `cd Practica_2/serverless/azure-functions && npm install`.
3. En VS Code, pestaña de Azure → inicia sesión → **Workspace → Deploy to Function App…** → elige tu Function App → confirma.

**Alternativa, Core Tools:** `npm i -g azure-functions-core-tools@4`, luego `func azure functionapp publish <nombre-function-app>`.

### 5.6 Probar
En la Function App → **Functions** aparecen `subirImagen` y `subirTexto`. Abre una → **Get function URL**, o prueba directo:

```bash
curl -X POST "https://<function-app>.azurewebsites.net/api/textos" \
  -H "Content-Type: application/json" \
  -d '{"name":"nota.txt","contentType":"text/plain","data":"SG9sYSBtdW5kbw=="}'
```
Debe regresar `201` con la URL del blob. Ábrela en el navegador.

**Capturas:** Resource Group · Function App · lista de funciones · App settings (oculta la cadena) · respuesta del curl.

---

## 6. Azure: API Management

### 6.1 Crear APIM (empieza este paso temprano)
1. **API Management services** → **Create** → mismo Resource Group.
2. *Name:* único (`g6-apim`). Región: la misma. *Pricing tier:* **Consumption** (se crea en minutos y es lo más barato) o **Developer** (tarda 30 a 40 minutos). **Review + create**.

### 6.2 Importar las funciones como rutas
1. En APIM → **APIs** → **+ Add API** → **Function App** → **Browse**.
2. Elige tu Function App y marca `subirImagen` y `subirTexto`. *API URL suffix:* `serverless` → **Create**.
3. En la API aparecen dos operaciones `POST`. Verifica que sus rutas sean `/imagenes` y `/textos`; si no, edítalas en *Frontend*.

### 6.3 Permitir llamadas sin llave
En la API → **Settings** → desmarca **Subscription required** → **Save**. Por qué: el frontend es público y no puede esconder una llave.

### 6.4 CORS
En la API → **All operations** → **Inbound processing → Add policy → Allow cross-origin resource sharing (CORS)**, o en el editor de código (`</>`):

```xml
<inbound>
  <base />
  <cors allow-credentials="false">
    <allowed-origins><origin>*</origin></allowed-origins>
    <allowed-methods><method>POST</method><method>OPTIONS</method></allowed-methods>
    <allowed-headers><header>*</header></allowed-headers>
  </cors>
</inbound>
```
→ **Save**.

### 6.5 Las URLs y la prueba
Gateway URL en la página *Overview*: `https://g6-apim.azure-api.net`. Tus dos URLs:

- `https://g6-apim.azure-api.net/serverless/imagenes`
- `https://g6-apim.azure-api.net/serverless/textos`

Prueba con el mismo `curl` del paso 5.6 cambiando la URL. También puedes usar la pestaña **Test** de APIM.

**Capturas:** instancia de APIM · API con las 2 operaciones · política CORS · prueba con respuesta `201`.

---

## 7. Entregarle las 4 URLs a Persona 3

Antes de que Miguel compile el frontend, mándale o guárdalas en `docs/persona4-serverless.md`:

```
AWS    imagen:  https://<id>.execute-api.us-east-1.amazonaws.com/imagenes
AWS    texto:   https://<id>.execute-api.us-east-1.amazonaws.com/textos
Azure  imagen:  https://<apim>.azure-api.net/serverless/imagenes
Azure  texto:   https://<apim>.azure-api.net/serverless/textos
Body:  POST JSON { name, contentType, data (base64) }
Resp:  201 { url, name, type }  ->  luego POST /api/files con { name, type, url }
```
En el frontend de S3 usa las URLs de AWS, y en el de Blob usa las de Azure.

---

## 8. Repositorio en GitHub

Verifica (rúbrica "Entregables" y "Requisitos"):
- [ ] Es **privado**.
- [ ] Se llama `SEMINARIO1_A_2S2026_G6`.
- [ ] Contiene la carpeta `Practica_2` con el código.
- [ ] Los **auxiliares** del curso están como colaboradores: Settings → Collaborators.
- [ ] No hay secretos subidos (`.env`, `local.settings.json`, llaves de AWS, cadenas de conexión).

---

## 9. README final (`Practica_2/README.md`)

Lo tuyo es ensamblar. Estructura que pide el enunciado:

1. **Datos de los estudiantes** (ya está la tabla).
2. **Arquitectura**: un diagrama de AWS (S3, EC2, ELB, RDS, Lambda, API Gateway) y uno de Azure (Blob, VM, LB, Functions, APIM), con una explicación corta.
3. **Usuarios IAM y políticas**: de [`docs/persona1-despliegue.md`](../docs/persona1-despliegue.md).
4. **Capturas de todos los recursos**: S3, EC2, Load Balancer, RDS, Lambda, API Gateway, Blob, VM, Azure Functions, APIM.
5. **Conclusión**: diferencias percibidas entre Azure y AWS. Escríbela con tu experiencia (por ejemplo: facilidad de la consola, tiempo de creación de APIM, cómo se despliega una función, permisos IAM vs RBAC).

Cómo: cada compañero te pasa su sección con capturas (Derek: IAM, EC2, ELB, VMs; Miguel: S3, Blob, RDS, frontend; Persona 2: backend Python y balanceador de Azure). Tú pones tus secciones de serverless y unes todo. Pon las imágenes en `docs/img/` y enlázalas con rutas relativas.

---

## 10. Para las preguntas de calificación (9 pts)

Debes saber explicar todo el sistema, no solo lo tuyo:
- Flujo completo: registro/login → backend → RDS (SP, contraseña con bcrypt, solo URL de la imagen) → JWT.
- Qué hace el balanceador y qué pasa si se apaga una EC2.
- Diferencia entre subir con el backend (Modo A) y con serverless (Modo B).
- Por qué hay API Gateway/APIM si ya existe la Lambda/Function.
- Por qué el rol de ejecución de la Lambda es distinto de tu usuario IAM.
- Qué es CORS y por qué se configura en el gateway.
- Qué guarda cada key: `profiles/`, `files/<id>/`, `images/`, `texts/`.

---

## Orden recomendado

| Cuándo | Qué |
|---|---|
| Día 1 | Mandar el mensaje de la sección 1. Crear Resource Group, Storage de prueba y **APIM** (Pasos 5.1 y 6.1) para que APIM se vaya creando |
| Día 1-2 | Function App y despliegue (5.3 a 5.6), después las rutas de APIM (6.2 a 6.5) |
| En cuanto lleguen los accesos | Lambdas (Paso 3), API Gateway (Paso 4), cambiar las variables a los recursos reales |
| Antes de compilar el frontend | Entregar las 4 URLs (Paso 7) |
| Siempre | Capturas mientras haces cada paso |
| Antes del 6 oct | Repo (Paso 8), README (Paso 9), repasar preguntas (Paso 10) |

## Errores frecuentes
- **El archivo sube pero la URL no abre:** el bucket/contenedor no es público.
- **El navegador dice "CORS error" y `curl` funciona:** falta CORS en API Gateway o APIM.
- **APIM devuelve 401:** sigue marcada *Subscription required*.
- **La Function da 500:** revisa las App settings (cadena y contenedor) y el log en *Monitor → Logs*.
- **Cambiaste una variable y no pasa nada:** en Azure presiona *Apply*; en Lambda, *Save*.
