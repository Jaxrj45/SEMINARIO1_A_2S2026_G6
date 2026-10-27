import { LexRuntimeV2Client, RecognizeTextCommand } from '@aws-sdk/client-lex-runtime-v2';
import { fromCognitoIdentityPool } from '@aws-sdk/credential-provider-cognito-identity';
import { CONFIG } from '../config/env';

let lexClient = null;

function getLexClient() {
  if (lexClient) return lexClient;

  if (!CONFIG.IDENTITY_POOL_ID || !CONFIG.LEX_BOT_ID) {
    return null;
  }

  try {
    const credentials = fromCognitoIdentityPool({
      identityPoolId: CONFIG.IDENTITY_POOL_ID,
      clientConfig: { region: CONFIG.AWS_REGION }
    });

    lexClient = new LexRuntimeV2Client({
      region: CONFIG.AWS_REGION,
      credentials
    });
    return lexClient;
  } catch (err) {
    console.error('Error al inicializar cliente de Lex:', err);
    return null;
  }
}

const mockResponses = [
  {
    keywords: ['horario', 'hora', 'abre', 'cierra', 'biblioteca'],
    reply: 'La Biblioteca de la Facultad de Ingeniería atiende de lunes a viernes de 07:00 a 19:00 horas y sábados de 08:00 a 13:00 horas en el Edificio T-3.'
  },
  {
    keywords: ['control academico', 'secretaria', 't4'],
    reply: 'Control Académico y Secretaría atienden de lunes a viernes de 08:00 a 16:00 horas en el Edificio T-4.'
  },
  {
    keywords: ['donde', 'ubicacion', 'edificio', 'llegar'],
    reply: 'La Facultad de Ingeniería se ubica en el Campus Central de la USAC, Zona 12, Ciudad de Guatemala (Edificios T-1, T-2, T-3, T-4 y T-5).'
  },
  {
    keywords: ['telefono', 'contacto', 'correo', 'pbx'],
    reply: 'Puedes contactar a la Facultad de Ingeniería al PBX +(502) 2418-8000 o al correo info@ingenieria.usac.edu.gt.'
  },
  {
    keywords: ['asignacion', 'cursos', 'notas', 'constancia', 'tramite'],
    reply: 'Las asignaciones de cursos y consulta de notas se realizan en el portal de Control Académico oficial (ingenieria.usac.edu.gt).'
  }
];

export async function sendLexMessage(inputText, sessionId = 'semi-user-session') {
  const client = getLexClient();

  if (CONFIG.IS_MOCK || !client) {
    // Simular latencia y respuesta
    await new Promise(r => setTimeout(r, 400));
    const lower = inputText.toLowerCase();
    for (const item of mockResponses) {
      if (item.keywords.some(k => lower.includes(k))) {
        return item.reply;
      }
    }
    return 'Hola, soy el asistente virtual de la Facultad de Ingeniería (USAC). Puedo informarte sobre horarios de atención, ubicación de edificios, contacto o trámites académicos.';
  }

  try {
    const command = new RecognizeTextCommand({
      botId: CONFIG.LEX_BOT_ID,
      botAliasId: CONFIG.LEX_BOT_ALIAS_ID,
      localeId: CONFIG.LEX_LOCALE_ID,
      sessionId,
      text: inputText
    });

    const response = await client.send(command);
    if (response.messages && response.messages.length > 0) {
      return response.messages.map(m => m.content).join('\n');
    }
    return 'No comprendí tu consulta. Por favor intenta preguntarme por horarios, ubicación o contactos.';
  } catch (error) {
    console.error('Error al comunicarse con Lex:', error);
    return 'Ocurrió un error al consultar el servicio de asistencia. Intenta nuevamente.';
  }
}
