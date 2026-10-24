import { Router } from 'express';
import { query, run } from '../config/db';
import { authRequired } from '../middleware/auth';
import { areFriends } from '../services/friends';
import { text, toId } from '../utils/format';
import { handler } from '../utils/handler';
import { ApiError, ok } from '../utils/http';
import { ComentarioRow, commentToJson } from '../utils/serialize';
import { throwIfInvalid } from '../utils/validate';

// mergeParams para poder leer :postId, que viene de /api/posts/:postId/comments
const router = Router({ mergeParams: true });
router.use(authRequired);

const MAX_TEXT = 1000;

const COMMENT_SELECT = `
  SELECT c.id, c.publicacion_id, c.texto, c.creado_en,
         u.id AS u_id, u.username AS u_username, u.nombre_completo AS u_nombre_completo, u.foto_key AS u_foto_key
    FROM comentarios c
    JOIN usuarios u ON u.id = c.usuario_id`;

// Solo el autor de la publicacion y sus amigos pueden ver y escribir comentarios
async function assertCanComment(postIdParam: string, me: number): Promise<number> {
  const postId = toId(postIdParam);
  const [post] = postId
    ? await query<{ usuario_id: number }>('SELECT usuario_id FROM publicaciones WHERE id = ?', [postId])
    : [];
  if (!post) throw new ApiError(404, 'NOT_FOUND', 'La publicación no existe');

  if (post.usuario_id !== me && !(await areFriends(me, post.usuario_id))) {
    throw new ApiError(403, 'NOT_FRIENDS', 'Solo los amigos del autor pueden comentar');
  }
  return postId!;
}

// GET /api/posts/:postId/comments (del mas viejo al mas nuevo)
router.get(
  '/',
  handler(async (req, res) => {
    const postId = await assertCanComment(req.params.postId, req.userId);
    const rows = await query<ComentarioRow>(
      `${COMMENT_SELECT} WHERE c.publicacion_id = ? ORDER BY c.creado_en, c.id`,
      [postId]
    );
    return ok(res, 'Comentarios obtenidos', rows.map(commentToJson));
  })
);

// POST /api/posts/:postId/comments   body: { "text": "..." }
router.post(
  '/',
  handler(async (req, res) => {
    const postId = await assertCanComment(req.params.postId, req.userId);
    const comment = text(req.body?.text);

    throwIfInvalid(
      comment && comment.length <= MAX_TEXT ? {} : { text: `Es obligatorio (máximo ${MAX_TEXT} caracteres)` }
    );

    const result = await run('INSERT INTO comentarios (publicacion_id, usuario_id, texto) VALUES (?, ?, ?)', [
      postId,
      req.userId,
      comment,
    ]);

    const [row] = await query<ComentarioRow>(`${COMMENT_SELECT} WHERE c.id = ?`, [result.insertId]);
    return ok(res, 'Comentario publicado', commentToJson(row), 201);
  })
);

export default router;
