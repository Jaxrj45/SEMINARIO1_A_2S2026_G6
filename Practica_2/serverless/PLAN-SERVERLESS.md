# Plan de Persona 4: qué hacer, en qué orden, qué pedir y qué entregar

Este archivo es el mapa. Para el detalle de cada clic de consola, ver [`GUIA-PERSONA4.md`](GUIA-PERSONA4.md).

> **Fechas:** entrega **6 oct 2026**, calificación **10 oct 2026**. No borres ningún recurso (APIM, Lambdas, etc.) antes de la calificación.

---

## 1. Qué es lo tuyo (en una frase)

Crear **4 funciones serverless** (2 en AWS, 2 en Azure) que reciben una imagen o un texto y lo guardan en el bucket/contenedor de archivos, más una **puerta de entrada** por nube (API Gateway y API Management) con una ruta por función. Al final armas el **README** del repo con las secciones de todos.

```
AWS:    Frontend -> API Gateway -> Lambda          -> S3 (images/ o texts/)
Azure:  Frontend -> API Management -> Azure Function -> Blob (images/ o texts/)
```

El código de las 4 funciones **ya está escrito** en esta carpeta. Tú solo lo despliegas y lo conectas.

---

## 2. Qué necesitas tener (accesos y datos)

Marca cada uno cuando lo tengas. Sin esto no puedes avanzar en el paso que dice "Bloquea".

| # | Qué | Quién lo da | Para qué | Estado |
|---|---|---|---|---|
| 1 | Acceso a Azure con rol **Contributor** sobre `rg-taskflow-g6` | Quien administra la suscripción | Crear Function App y APIM | Listo |
| 2 | Proveedores **Microsoft.ApiManagement** y **Microsoft.Web** registrados en la suscripción | Dueño de la suscripción | Crear APIM y Function App | **Pendiente** (bloquea Azure) |
| 3 | Acceso a la consola de AWS (usuario IAM y contraseña) | Derek | Entrar a Lambda y API Gateway | Listo (entras con `jose`) |
| 4 | **Rol de ejecución** de Lambda (por ejemplo `g6-lambda-role`) con logs y `s3:PutObject` sobre el bucket | Derek | Crear las Lambdas | **Pendiente** (bloquea AWS) |
| 5 | Permiso `iam:PassRole` sobre ese rol para tu usuario | Derek | Poder elegir el rol al crear la función | **Pendiente** |
| 6 | Permisos de **API Gateway** para tu usuario (o el usuario `g6-apigateway`) | Derek | Paso de API Gateway | Por confirmar |
| 7 | **Nombre del bucket S3 de archivos** (`practica2semi1...Archivosg6`), con objetos públicos y CORS `GET` | Miguel | Variable `S3_BUCKET` y pruebas | **Pendiente** |
| 8 | **Cuenta de almacenamiento** y **contenedor de archivos** de Azure, con lectura pública y CORS | Miguel | Variables de la Function App | **Pendiente** |
| 9 | Cadena de conexión de esa cuenta (Access keys) | Tú, desde el portal, cuando tengas acceso a la cuenta | Variable `AZURE_STORAGE_CONNECTION_STRING` | Pendiente |
| 10 | Secciones y capturas de los demás para el README | Todos | README final | Al final |

### Mensajes listos para mandar

**A quien administra la suscripción de Azure:**
> Necesito que registres estos proveedores en la suscripción (Subscriptions → Azure subscription 1 → Resource providers → Register): **Microsoft.ApiManagement** y **Microsoft.Web**. Sin eso falla la creación de la API Management y la Function App.

**A Derek:**
> Necesito un rol de ejecución para mis Lambdas (servicio de confianza Lambda, política `AWSLambdaBasicExecutionRole` y una política con `s3:PutObject` sobre el bucket de archivos). Pásame el nombre y dale a mi usuario `jose` permiso `iam:PassRole` sobre ese rol. También necesito permisos de API Gateway (o las credenciales de `g6-apigateway`). ¿Con qué usuario entro para Lambda?

**A Miguel:**
> Pásame: (1) nombre exacto del bucket S3 de archivos, (2) nombre de la cuenta de almacenamiento de Azure y del contenedor de archivos. Necesito que el bucket y el contenedor tengan lectura pública y CORS. Yo te doy las 4 URLs de las rutas serverless cuando las tenga.

---

## 3. Orden de trabajo

Mientras esperas lo que está pendiente, avanza en lo que no depende de nadie.

| Paso | Qué haces | Necesita (de la tabla 2) | Dónde está el detalle |
|---|---|---|---|
| 1 | Mandar los 3 mensajes de arriba | Nada | Este archivo |
| 2 | Azure: crear **API Management** (tier **Consumption**, `rg-taskflow-g6`, East US, nombre `g6-apim`) | 1, 2 | Guía 6.1 |
| 3 | Azure: crear la **Function App** (Consumption, Node.js 22, Linux, East US) | 1, 2 | Guía 5.3 |
| 4 | Azure: variables de entorno `AZURE_STORAGE_CONNECTION_STRING` y `AZURE_STORAGE_CONTAINER` | 8, 9 | Guía 5.4 |
| 5 | Azure: desplegar el código de `azure-functions/` y probar con `curl` | Pasos 3 y 4 | Guía 5.5 y 5.6 |
| 6 | Azure: importar las 2 funciones en APIM, quitar *Subscription required*, agregar CORS, probar | Paso 5 | Guía 6.2 a 6.5 |
| 7 | AWS: crear `g6-subir-imagen` y `g6-subir-texto`, pegar código, timeout 15 s, variable `S3_BUCKET` | 4, 5, 7 | Guía 3 |
| 8 | AWS: crear el **API Gateway** HTTP con `POST /imagenes` y `POST /textos`, CORS, probar | 6, paso 7 | Guía 4 |
| 9 | Mandar las **4 URLs** a Miguel | Pasos 6 y 8 | Guía 7 |
| 10 | Verificar el repo en GitHub | Nada | Guía 8 |
| 11 | Armar el **README** final con las secciones de todos | 10 | Guía 9 |
| 12 | Repasar las preguntas de calificación | Todo | Guía 10 |

> Si Azure se atora en el paso 2 y AWS en el 7, **no pares**: escribe tu parte del README con lo que ya tienes (arquitectura, diagramas, explicación del código).

---

## 4. Qué debes entregar

### Para Miguel (antes de que compile el frontend)
Las 4 URLs, en este formato:
```
AWS    imagen:  https://v6vbfsjqyb.execute-api.us-east-1.amazonaws.com/imagenes
AWS    texto:   https://v6vbfsjqyb.execute-api.us-east-1.amazonaws.com/textos
Azure  imagen:  https://<apim>.azure-api.net/serverless/imagenes
Azure  texto:   https://<apim>.azure-api.net/serverless/textos
Body:  POST JSON { name, contentType, data (base64) }
Resp:  201 { url, name, type }
```

### Para la calificación (README del repo)
- **Datos de los estudiantes** (ya está la tabla).
- **Diagrama de arquitectura de AWS**: S3, EC2, ELB, RDS, Lambda, API Gateway. Explicación corta.
- **Diagrama de arquitectura de Azure**: Blob, VM, Load Balancer, Functions, APIM. Explicación corta.
- **Usuarios IAM y políticas** (lo da Derek; ver `docs/persona1-despliegue.md`).
- **Capturas de todos los recursos**: S3, EC2, ELB, RDS, Lambda, API Gateway, Blob, VM, Azure Functions, APIM.
- **Conclusión**: diferencias que notaste entre Azure y AWS, con tu experiencia (facilidad de la consola, tiempo de creación, cómo se despliega una función, permisos IAM vs RBAC).

### Tus capturas obligatorias
| Servicio | Qué capturar |
|---|---|
| Lambda | Lista de funciones · código · variable `S3_BUCKET` · rol · resultado del Test |
| API Gateway | Rutas con integraciones · CORS · Invoke URL · respuesta del `curl` |
| Azure Function App | Resource Group · Function App · lista de funciones · App settings (**oculta la cadena de conexión**) · respuesta del `curl` |
| APIM | Instancia · API con las 2 operaciones · política CORS · prueba con `201` |
| Repo | Configuración privada y colaboradores |

### Checklist de GitHub (rúbrica Entregables y Requisitos)
- [ ] Repo **privado**.
- [ ] Nombre `SEMINARIO1_A_2S2026_G6`.
- [ ] Carpeta `Practica_2` con el código.
- [ ] Auxiliares agregados como colaboradores (Settings → Collaborators).
- [ ] **Sin secretos**: ni `.env`, ni `local.settings.json`, ni llaves de AWS, ni cadenas de conexión, ni archivos `*accessKeys.csv`.

---

## 5. Posibles errores y qué hacer

### Permisos y acceso
| Error | Causa | Solución |
|---|---|---|
| `iam:CreateRole ... no identity-based policy allows` | Tu usuario no puede crear roles | No crees el rol por defecto. Pídele el rol a Derek y elígelo con *Use an existing role* |
| No me deja elegir el rol | Falta `iam:PassRole` | Pídeselo a Derek |
| `The subscription is not registered to use namespace 'Microsoft.ApiManagement'` (o `Microsoft.Web`) | Proveedor sin registrar | Pídele al dueño de la suscripción que lo registre |
| `You do not have permissions to create resource groups` | No tienes permisos a nivel suscripción | Usa el grupo existente `rg-taskflow-g6`, no crees otro |
| No veo las Lambdas al crear la integración en API Gateway | Falta `lambda:ListFunctions` | Pídeselo a Derek, o pega el ARN de la Lambda a mano |
| No aparece el tier Consumption | Región o suscripción | Prueba otra región. **No uses Developer ni tiers superiores**: cobran por hora y gastan tus créditos |

### Pruebas
| Síntoma | Causa |
|---|---|
| `AccessDenied` dentro del Test de la Lambda | Falta `s3:PutObject` en el rol |
| La URL devuelta da `AccessDenied` en el navegador | El bucket u objetos no son públicos (Miguel) |
| `Cannot find package '@aws-sdk/client-s3'` | El runtime no es Node.js 18+ |
| `Task timed out` | Sube el timeout o revisa el nombre del bucket |
| CORS error en el navegador pero `curl` funciona | Falta CORS en API Gateway o APIM |
| APIM devuelve 401 | *Subscription required* sigue marcada |
| La Function da 500 | Revisa las App settings (cadena y contenedor) y el log en *Monitor → Logs* |
| Cambié una variable y no pasa nada | Azure: **Apply**. Lambda: **Save** |
| Respuesta 400 `El cuerpo debe ser JSON valido` | El body no es JSON o falta `Content-Type: application/json` |
| Respuesta 400 `Archivo vacio o mayor a 4 MB` | La imagen o el texto pesa más de 4 MB |

### Seguridad y créditos
- El archivo `g6-backend-s3_accessKeys.csv` son **claves del backend**, no tuyas ni para la consola. **Sácalo de la carpeta del repo** y no lo subas a GitHub.
- No pegues cadenas de conexión ni claves en el código, en el README ni en capturas.
- Tienes ~200 créditos de Azure. Usa **Consumption** en APIM y la Function App. No dejes recursos de prueba corriendo.

---

## 6. Para la calificación (9 pts): debes saber explicar

- Flujo completo: registro/login → backend → RDS (SP, contraseña con bcrypt, solo la URL de la imagen) → JWT.
- Qué hace el balanceador y qué pasa si se apaga una EC2 o VM.
- Diferencia entre subir con el backend (Modo A) y con serverless (Modo B).
- Por qué hay API Gateway/APIM si ya existe la Lambda/Function (URL pública, rutas, CORS).
- Por qué el rol de la Lambda es distinto de tu usuario IAM.
- Qué es CORS y por qué se configura en el gateway.
- Qué guarda cada carpeta del bucket: `profiles/`, `files/<id>/`, `images/`, `texts/`.

---

## 7. Estado actual

- Azure: Contributor en `rg-taskflow-g6` listo. **Bloqueado** por el registro de `Microsoft.ApiManagement` y `Microsoft.Web`.
- AWS: consola abierta. **Bloqueado** por el rol de ejecución (`iam:CreateRole`, `iam:PassRole`).
- Pendiente de Miguel: nombre del bucket S3, cuenta y contenedor de Azure.
- Hecho: código de las 4 funciones y guía.
