/**
 * Lambda de Fulfillment para Amazon Lex V2 - Bot Semi-Social Facultad de Ingeniería USAC
 * Runtime: Node.js 22.x
 * Rol: Semi-LexFulfillment-Role
 */

export const handler = async (event) => {
  console.log('Lex Event recibido:', JSON.stringify(event, null, 2));

  const intentName = event?.sessionState?.intent?.name || 'FallbackIntent';
  const slots = event?.sessionState?.intent?.slots || {};

  let messageText = '';

  switch (intentName) {
    case 'Horarios': {
      const lugarSlot = slots?.lugar?.value?.interpretedValue?.toLowerCase() || '';
      
      if (lugarSlot.includes('biblioteca')) {
        messageText = 'La Biblioteca de la Facultad de Ingeniería atiende de lunes a viernes de 07:00 a 19:00 horas y sábados de 08:00 a 13:00 horas.';
      } else if (lugarSlot.includes('control') || lugarSlot.includes('acad')) {
        messageText = 'Control Académico atiende de lunes a viernes de 08:00 a 16:00 horas en el Edificio T-4.';
      } else if (lugarSlot.includes('secretar') || lugarSlot.includes('decanato')) {
        messageText = 'Secretaría Académica y Decanato atienden de lunes a viernes de 08:00 a 15:30 horas en el Edificio T-4, segundo nivel.';
      } else if (lugarSlot.includes('lab') || lugarSlot.includes('computo') || lugarSlot.includes('t3')) {
        messageText = 'Los Laboratorios de Cómputo (Edificio T-3) están disponibles de lunes a viernes de 07:00 a 20:00 horas y sábados de 07:00 a 14:00 horas.';
      } else if (lugarSlot.includes('asistencia') || lugarSlot.includes('estudiantil')) {
        messageText = 'El departamento de Bienestar y Asistencia Estudiantil atiende de lunes a viernes de 08:00 a 16:00 horas.';
      } else {
        messageText = 'Los horarios generales de atención administrativa en la Facultad de Ingeniería son de lunes a viernes de 08:00 a 16:00 horas. Para laboratorios: 07:00 a 20:00 horas.';
      }
      break;
    }

    case 'PreguntasFrecuentes': {
      messageText = 'Preguntas Frecuentes de la Facultad de Ingeniería:\n' +
        '1. Asignaciones de cursos: Se realizan al inicio de cada semestre en el portal de Control Académico (ingenieria.usac.edu.gt).\n' +
        '2. Solicitud de constancias: Se tramitan en línea desde el portal del estudiante en el apartado de trámites.\n' +
        '3. Cierre de pensum: Requiere solvencia de biblioteca, laboratorios y aprobación de EPS o tesis.\n' +
        '4. Consulta de notas: Disponibles en tiempo real en la plataforma académica oficial.';
      break;
    }

    case 'Ubicacion': {
      messageText = 'La Facultad de Ingeniería de la USAC se ubica en el Campus Central, Ciudad Universitaria, Zona 12, Ciudad de Guatemala. Los edificios principales son T-1, T-2, T-3, T-4 y T-5.';
      break;
    }

    case 'Contacto': {
      messageText = 'Medios de contacto de la Facultad de Ingeniería:\n' +
        '- PBX: +(502) 2418-8000\n' +
        '- Correo Oficial: info@ingenieria.usac.edu.gt\n' +
        '- Sitio Web: https://ingenieria.usac.edu.gt\n' +
        '- Facebook / Twitter: @ingenieriausac';
      break;
    }

    default: {
      messageText = 'Hola, soy el asistente virtual de la Facultad de Ingeniería. Puedo ayudarte con: horarios de atención, preguntas frecuentes sobre trámites y asignaciones, ubicación de edificios y contactos.';
      break;
    }
  }

  return {
    sessionState: {
      dialogAction: {
        type: 'Close',
      },
      intent: {
        name: intentName,
        state: 'Fulfilled',
      },
    },
    messages: [
      {
        contentType: 'PlainText',
        content: messageText,
      },
    ],
  };
};
