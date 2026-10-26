import { TranslateClient, TranslateTextCommand } from '@aws-sdk/client-translate';
import { env } from '../config/env';
import { ApiError } from '../utils/http';

// Sin llaves: en la EC2 usa el rol Semi-EC2-AppRole
const client = new TranslateClient({ region: env.awsRegion });

// El idioma de origen lo detecta Translate ("auto"), para eso el rol necesita comprehend:DetectDominantLanguage
export async function translateText(
  text: string,
  targetLang: string
): Promise<{ translatedText: string; sourceLang: string }> {
  try {
    const result = await client.send(
      new TranslateTextCommand({ Text: text, SourceLanguageCode: 'auto', TargetLanguageCode: targetLang })
    );
    return { translatedText: result.TranslatedText || '', sourceLang: result.SourceLanguageCode || '' };
  } catch (e) {
    console.error('[translate] TranslateText:', e);
    throw new ApiError(502, 'UPSTREAM_ERROR', 'No se pudo traducir el texto');
  }
}
