[ ← Regresar ](../../README.md)

# Configuración del bot de Lex

Todo se hace desde la consola web de AWS, en la región **us-east-1**. El bot responde preguntas sobre la Facultad de Ingeniería: horarios, preguntas frecuentes, ubicación y contacto.

Antes hay que tener el rol `Semi-LexFulfillment-Role` ([configuracion-iam.md](configuracion-iam.md)). Después de terminar se completa el paso 5.2 de [configuracion-cognito.md](configuracion-cognito.md).

Las líneas que dicen **(captura)** son las que van al README final.

## Índice

1. [Lambda de respuestas](#1-lambda-de-respuestas)
2. [Crear el bot](#2-crear-el-bot)
3. [Tipo de slot](#3-tipo-de-slot)
4. [Intents](#4-intents)
5. [Probar](#5-probar)
6. [Versión y alias](#6-versión-y-alias)
7. [Datos para el frontend](#7-datos-para-el-frontend)

## 1. Lambda de respuestas

La rúbrica valora que el bot use una Lambda para armar las respuestas, así que primero se crea esa función.

**Lambda** → **Create function**.

| Campo | Valor |
|---|---|
| Opción | Author from scratch |
| Function name | `lex-facultad` |
| Runtime | Node.js 22.x |
| Change default execution role | **Use an existing role** → `Semi-LexFulfillment-Role` |

En **Code** pegar el contenido de `Proyecto/lambdas/lex-facultad/index.mjs` → **Deploy**.

Lex espera que la Lambda responda con esta forma:

```json
{
  "sessionState": {
    "dialogAction": { "type": "Close" },
    "intent": { "name": "<nombre-del-intent>", "state": "Fulfilled" }
  },
  "messages": [{ "contentType": "PlainText", "content": "Texto de la respuesta" }]
}
```

Si la respuesta no tiene esa forma, el bot contesta con un error genérico.

## 2. Crear el bot

**Amazon Lex** → **Bots** → **Create bot**.

| Campo | Valor |
|---|---|
| Creation method | Create a blank bot |
| Bot name | `semi-facultad-bot` |
| IAM permissions | Create a role with basic Amazon Lex permissions |
| Children's Online Privacy Protection Act (COPPA) | No |
| Idle session timeout | 5 minutos |

**Next**.

| Campo | Valor |
|---|---|
| Language | Spanish (LATAM) |
| Voice interaction | None (solo texto) |
| Intent classification confidence score threshold | 0.40 |

**Done**. La consola abre directo el primer intent.

## 3. Tipo de slot

Un slot es un dato que el bot le pide al usuario. Para los horarios se necesita saber de qué lugar pregunta.

En el menú de la izquierda del idioma → **Slot types** → **Add slot type** → **Add blank slot type** → nombre `TipoLugar`.

| Campo | Valor |
|---|---|
| Slot value resolution | Restrict to slot values |
| Values | `biblioteca`, `control academico`, `secretaria`, `laboratorios`, `asistencia estudiantil` |

**Save slot type**.

## 4. Intents

Un intent es algo que el usuario quiere preguntar. Por cada uno se ponen frases de ejemplo para que el bot lo reconozca.

Para cada intent de la tabla: **Intents** → **Add intent** → **Add empty intent** (el primero se puede renombrar desde el que abrió la consola).

| Intent | Frases de ejemplo |
|---|---|
| `Horarios` | `cual es el horario`, `a que hora abre {lugar}`, `horario de {lugar}`, `a que hora cierra {lugar}`, `que horario tiene {lugar}` |
| `PreguntasFrecuentes` | `como me asigno cursos`, `cuando son las asignaciones`, `como pido una constancia`, `donde veo mis notas`, `preguntas frecuentes` |
| `Ubicacion` | `donde queda la facultad`, `como llego a la facultad`, `en que edificio esta ingenieria`, `ubicacion de la facultad` |
| `Contacto` | `cual es el telefono`, `como los contacto`, `cual es el correo de la facultad`, `contacto` |

Poner por lo menos 5 frases en cada uno. Mientras más frases, mejor entiende el bot.

### Slot de Horarios

En el intent `Horarios` → **Slots** → **Add slot**.

| Campo | Valor |
|---|---|
| Name | `lugar` |
| Slot type | `TipoLugar` |
| Prompts | `¿De qué lugar quieres saber el horario? Biblioteca, control académico, secretaría, laboratorios o asistencia estudiantil` |
| Required | Marcado |

### Usar la Lambda en cada intent

En cada uno de los 4 intents → sección **Fulfillment** → **Advanced options** → marcar **Use a Lambda function for fulfillment** → **Update options** → **Save intent**.

### FallbackIntent

Lex trae un `FallbackIntent` para cuando no entiende. En su sección **Closing response** poner un mensaje como: `No entendí tu pregunta. Puedo ayudarte con horarios, preguntas frecuentes, ubicación y contacto de la facultad.`

**(captura)** La lista de intents y el detalle de `Horarios` con sus frases y su slot.

## 5. Probar

### 5.1 Conectar la Lambda al alias de prueba

**Deployment** → **Aliases** → `TestBotAlias` → en **Languages**, **Spanish (LATAM)** → **Source**: `lex-facultad`, **Lambda function version or alias**: `$LATEST` → **Save**.

### 5.2 Build y prueba

Arriba a la derecha → **Build**. Tarda un minuto. Después → **Test** y escribir preguntas como `a que hora abre la biblioteca` o `donde queda la facultad`.

Si responde `Invalid Lambda Response` o un error de permisos, la Lambda no tiene permiso para que Lex la llame. En **Lambda** → `lex-facultad` → **Configuration** → **Permissions** → **Resource-based policy statements** → **Add permissions**:

| Campo | Valor |
|---|---|
| Opción | AWS service |
| Service | Other |
| Statement ID | `lex-invoke` |
| Principal | `lexv2.amazonaws.com` |
| Source ARN | ARN del alias del bot (se ve en **Aliases** → alias) |
| Action | `lambda:InvokeFunction` |

**(captura)** La ventana de prueba con varias respuestas.

## 6. Versión y alias

`TestBotAlias` es solo para probar, así que para la página se crea una versión fija y un alias propio.

1. **Bot versions** → **Create version** → **Create**. Queda como `Version 1`.
2. **Deployment** → **Aliases** → **Create alias** → **Alias name**: `produccion` → **Associate with a version**: `Version 1` → **Create**.
3. En el alias `produccion` → **Languages** → **Spanish (LATAM)** → **Source**: `lex-facultad`, versión `$LATEST` → **Save**.

Si después se cambian los intents, hay que hacer **Build**, crear otra versión y cambiar el alias `produccion` a la versión nueva.

**(captura)** El alias `produccion` con su versión y su Lambda.

## 7. Datos para el frontend

| Dato | Dónde se ve |
|---|---|
| Bot ID | **Bots** → `semi-facultad-bot` → **Bot details** |
| Alias ID | **Aliases** → `produccion` |
| Locale ID | `es_419` |
| Región | `us-east-1` |

Con el Bot ID y el Alias ID se completa la política del Identity Pool (paso 5.2 de [configuracion-cognito.md](configuracion-cognito.md)). Sin eso, el bot funciona en la consola pero no desde la página.
