import { Router } from 'express';
import { authRequired } from '../middleware/auth';
import { translateText } from '../services/translate';
import { text } from '../utils/format';
import { handler } from '../utils/handler';
import { ApiError, ok } from '../utils/http';
import { throwIfInvalid } from '../utils/validate';

const router = Router();
router.use(authRequired);

const LANGUAGES = ['es', 'en', 'fr', 'pt'];
// Translate acepta hasta 10,000 bytes por peticion; las descripciones y comentarios llegan a 1000
const MAX_TEXT = 5000;

// POST /api/translate   body: { "text": "Hola mundo", "targetLang": "en" }
router.post(
  '/',
  handler(async (req, res) => {
    const content = text(req.body?.text);
    const targetLang = req.body?.targetLang;

    const fields: Record<string, string> = {};
    if (!content || content.length > MAX_TEXT) fields.text = `Es obligatorio (máximo ${MAX_TEXT} caracteres)`;
    if (!LANGUAGES.includes(targetLang)) fields.targetLang = 'Debe ser es, en, fr o pt';
    if (fields.targetLang && !fields.text) {
      throw new ApiError(400, 'VALIDATION_ERROR', 'Idioma no soportado', fields);
    }
    throwIfInvalid(fields);

    const result = await translateText(content, targetLang);
    return ok(res, 'Texto traducido', { ...result, targetLang });
  })
);

export default router;
