import { Router } from 'express';
import { query } from '../config/db';
import { authRequired } from '../middleware/auth';
import { areFriends } from '../services/friends';
import { toId } from '../utils/format';
import { handler } from '../utils/handler';
import { ApiError, ok } from '../utils/http';
import { MensajeRow, messageToJson } from '../utils/serialize';

const router = Router();
router.use(authRequired);

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 100;

// GET /api/chat/:friendId/messages?beforeId=&limit=
// Historial con un amigo, del mas viejo al mas nuevo. beforeId sirve para cargar mensajes anteriores.
router.get(
  '/:friendId/messages',
  handler(async (req, res) => {
    const me = req.userId;
    const friendId = toId(req.params.friendId);
    const beforeId = toId(req.query.beforeId);
    const limit = Math.min(toId(req.query.limit) || DEFAULT_LIMIT, MAX_LIMIT);

    const [friend] = friendId ? await query('SELECT id FROM usuarios WHERE id = ?', [friendId]) : [];
    if (!friend) throw new ApiError(404, 'NOT_FOUND', 'El usuario no existe');
    if (!(await areFriends(me, friendId!))) {
      throw new ApiError(403, 'NOT_FRIENDS', 'Solo puedes ver el chat con tus amigos');
    }

    const params: unknown[] = [me, friendId, friendId, me];
    let filter = '';
    if (beforeId) {
      filter = 'AND id < ?';
      params.push(beforeId);
    }
    params.push(limit);

    // Se toman los ultimos "limit" y luego se voltean para que queden en orden ascendente
    const rows = await query<MensajeRow>(
      `SELECT id, emisor_id, receptor_id, texto, creado_en
         FROM mensajes
        WHERE ((emisor_id = ? AND receptor_id = ?) OR (emisor_id = ? AND receptor_id = ?)) ${filter}
        ORDER BY id DESC
        LIMIT ?`,
      params
    );

    return ok(res, 'Mensajes obtenidos', rows.reverse().map(messageToJson));
  })
);

export default router;
