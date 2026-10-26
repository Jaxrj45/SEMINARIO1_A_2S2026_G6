import { Router } from 'express';
import { query } from '../config/db';
import { authRequired } from '../middleware/auth';
import { VISIBLE_TO } from '../services/posts';
import { text } from '../utils/format';
import { handler } from '../utils/handler';
import { ok } from '../utils/http';
import { likePattern } from '../utils/validate';

const router = Router();
router.use(authRequired);

// GET /api/tags?q=
// Etiquetas de las publicaciones de mi feed, en orden alfabetico. El filtro "Todos" lo agrega el frontend.
router.get(
  '/',
  handler(async (req, res) => {
    const me = req.userId;
    const search = text(req.query.q);

    const params: unknown[] = [me, me, me];
    let filter = '';
    if (search) {
      filter = 'AND e.nombre LIKE ?';
      params.push(likePattern(search));
    }

    const rows = await query<{ nombre: string; total: number }>(
      `SELECT e.nombre, COUNT(*) AS total
         FROM publicacion_etiquetas pe
         JOIN etiquetas e ON e.id = pe.etiqueta_id
         JOIN publicaciones p ON p.id = pe.publicacion_id
        WHERE ${VISIBLE_TO} ${filter}
        GROUP BY e.id, e.nombre
        ORDER BY e.nombre`,
      params
    );

    return ok(
      res,
      'Etiquetas obtenidas',
      rows.map((row) => ({ name: row.nombre, count: Number(row.total) }))
    );
  })
);

export default router;
