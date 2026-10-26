import { Router } from 'express';
import { pool } from '../config/db';
import { authRequired } from '../middleware/auth';
import { findFeed, findPostById } from '../services/posts';
import { text } from '../utils/format';
import { handler } from '../utils/handler';
import { ApiError, ok } from '../utils/http';
import { throwIfInvalid } from '../utils/validate';

const router = Router();
router.use(authRequired);

const MAX_DESCRIPTION = 1000;
const MAX_LABEL = 100; // largo de etiquetas.nombre
const MAX_LABELS = 50;

// Etiquetas sin repetir y sin vacias. MySQL compara sin mayusculas, asi que Beach y beach son la misma.
function cleanLabels(value: unknown[]): string[] {
  const seen = new Set<string>();
  const labels: string[] = [];
  for (const item of value) {
    const label = text(item);
    if (!label || seen.has(label.toLowerCase())) continue;
    seen.add(label.toLowerCase());
    labels.push(label);
  }
  return labels;
}

// GET /api/posts?tag=
router.get(
  '/',
  handler(async (req, res) => {
    const posts = await findFeed(req.userId, text(req.query.tag));
    return ok(res, 'Publicaciones obtenidas', posts);
  })
);

// POST /api/posts   body: { "description": "...", "imageKey": "Fotos_Publicadas/...", "labels": ["Beach"] }
// El frontend ya subio la imagen con upload/post y reenvia la key y las etiquetas de Rekognition
router.post(
  '/',
  handler(async (req, res) => {
    const body = req.body || {};
    const description = text(body.description) || null;
    const imageKey = text(body.imageKey);
    const rawLabels = body.labels ?? [];
    const labels = Array.isArray(rawLabels) ? cleanLabels(rawLabels) : [];

    if (!imageKey.startsWith('Fotos_Publicadas/')) {
      throw new ApiError(400, 'VALIDATION_ERROR', 'La imagen es obligatoria', { imageKey: 'Requerido' });
    }

    const fields: Record<string, string> = {};
    if (description && description.length > MAX_DESCRIPTION) {
      fields.description = `Máximo ${MAX_DESCRIPTION} caracteres`;
    }
    if (!Array.isArray(rawLabels) || labels.length > MAX_LABELS || labels.some((l) => l.length > MAX_LABEL)) {
      fields.labels = `Debe ser una lista de hasta ${MAX_LABELS} textos de ${MAX_LABEL} caracteres como máximo`;
    }
    throwIfInvalid(fields);

    // La publicacion y sus etiquetas se guardan juntas o no se guarda nada
    const connection = await pool.getConnection();
    let postId: number;
    try {
      await connection.beginTransaction();
      const [result]: any = await connection.query(
        'INSERT INTO publicaciones (usuario_id, descripcion, imagen_key) VALUES (?, ?, ?)',
        [req.userId, description, imageKey]
      );
      postId = result.insertId;

      if (labels.length > 0) {
        // IGNORE: las etiquetas que ya existen se dejan como estan
        await connection.query('INSERT IGNORE INTO etiquetas (nombre) VALUES ?', [labels.map((l) => [l])]);
        await connection.query(
          `INSERT INTO publicacion_etiquetas (publicacion_id, etiqueta_id)
           SELECT ?, id FROM etiquetas WHERE nombre IN (?)`,
          [postId, labels]
        );
      }
      await connection.commit();
    } catch (e) {
      await connection.rollback();
      throw e;
    } finally {
      connection.release();
    }

    const post = await findPostById(postId);
    return ok(res, 'Publicación creada', post, 201);
  })
);

export default router;
