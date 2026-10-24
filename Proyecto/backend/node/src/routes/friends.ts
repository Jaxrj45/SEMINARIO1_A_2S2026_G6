import { Router } from 'express';
import { isDuplicate, query, run } from '../config/db';
import { authRequired } from '../middleware/auth';
import { toId } from '../utils/format';
import { handler } from '../utils/handler';
import { ApiError, ok } from '../utils/http';
import { requestToJson, SolicitudRow, userSummary } from '../utils/serialize';
import { throwIfInvalid } from '../utils/validate';

const router = Router();
router.use(authRequired);

// Solicitud con los datos cortos de quien la manda (s_) y de quien la recibe (d_)
const REQUEST_SELECT = `
  SELECT a.id, a.estado, a.creado_en, a.solicitante_id, a.destinatario_id,
         s.id AS s_id, s.username AS s_username, s.nombre_completo AS s_nombre_completo, s.foto_key AS s_foto_key,
         d.id AS d_id, d.username AS d_username, d.nombre_completo AS d_nombre_completo, d.foto_key AS d_foto_key
    FROM amistades a
    JOIN usuarios s ON s.id = a.solicitante_id
    JOIN usuarios d ON d.id = a.destinatario_id`;

async function findRequest(id: number): Promise<SolicitudRow | null> {
  const [row] = await query<SolicitudRow>(`${REQUEST_SELECT} WHERE a.id = ?`, [id]);
  return row || null;
}

// POST /api/friends/requests
router.post(
  '/requests',
  handler(async (req, res) => {
    const me = req.userId;
    const toUserId = toId(req.body?.toUserId);

    throwIfInvalid(toUserId ? {} : { toUserId: 'Es obligatorio' });
    if (toUserId === me) {
      throw new ApiError(400, 'VALIDATION_ERROR', 'No puedes enviarte una solicitud a ti mismo', {
        toUserId: 'No puede ser tu propio usuario',
      });
    }

    const [target] = await query('SELECT id FROM usuarios WHERE id = ?', [toUserId]);
    if (!target) throw new ApiError(404, 'NOT_FOUND', 'El usuario no existe');

    // Solo hay una fila por pareja, sin importar quien la mando
    const [existing] = await query<{ id: number; estado: string }>(
      `SELECT id, estado FROM amistades
        WHERE usuario_menor = LEAST(?, ?) AND usuario_mayor = GREATEST(?, ?)`,
      [me, toUserId, me, toUserId]
    );

    let requestId: number;
    if (existing?.estado === 'accepted') {
      throw new ApiError(409, 'ALREADY_FRIENDS', 'Ya son amigos');
    } else if (existing?.estado === 'pending') {
      throw new ApiError(409, 'REQUEST_ALREADY_EXISTS', 'Ya existe una solicitud pendiente con este usuario');
    } else if (existing) {
      // Habia una rechazada: se reutiliza la fila
      await run(
        `UPDATE amistades
            SET solicitante_id = ?, destinatario_id = ?, estado = 'pending',
                creado_en = UTC_TIMESTAMP(), respondido_en = NULL
          WHERE id = ?`,
        [me, toUserId, existing.id]
      );
      requestId = existing.id;
    } else {
      try {
        const result = await run('INSERT INTO amistades (solicitante_id, destinatario_id) VALUES (?, ?)', [
          me,
          toUserId,
        ]);
        requestId = result.insertId;
      } catch (e) {
        // Los dos se mandaron solicitud al mismo tiempo
        if (isDuplicate(e)) {
          throw new ApiError(409, 'REQUEST_ALREADY_EXISTS', 'Ya existe una solicitud pendiente con este usuario');
        }
        throw e;
      }
    }

    const request = (await findRequest(requestId))!;
    return ok(res, 'Solicitud enviada', requestToJson(request), 201);
  })
);

// GET /api/friends/requests
// Solo las pendientes: las que me mandaron y las que yo mande
router.get(
  '/requests',
  handler(async (req, res) => {
    const me = req.userId;
    const rows = await query<SolicitudRow>(
      `${REQUEST_SELECT}
        WHERE a.estado = 'pending' AND (a.destinatario_id = ? OR a.solicitante_id = ?)
        ORDER BY a.creado_en DESC, a.id DESC`,
      [me, me]
    );

    return ok(res, 'Solicitudes obtenidas', {
      received: rows.filter((r) => r.destinatario_id === me).map(requestToJson),
      sent: rows.filter((r) => r.solicitante_id === me).map(requestToJson),
    });
  })
);

// PUT /api/friends/requests/:id   body: { "action": "accept" | "reject" }
router.put(
  '/requests/:id',
  handler(async (req, res) => {
    const me = req.userId;
    const id = toId(req.params.id);
    const action = req.body?.action;

    throwIfInvalid(action === 'accept' || action === 'reject' ? {} : { action: 'Debe ser accept o reject' });

    const request = id ? await findRequest(id) : null;
    if (!request) throw new ApiError(404, 'NOT_FOUND', 'La solicitud no existe');
    if (request.destinatario_id !== me) {
      throw new ApiError(403, 'FORBIDDEN', 'Solo quien recibe la solicitud puede responderla');
    }
    if (request.estado !== 'pending') {
      throw new ApiError(400, 'VALIDATION_ERROR', 'La solicitud ya fue respondida');
    }

    const estado = action === 'accept' ? 'accepted' : 'rejected';
    await run('UPDATE amistades SET estado = ?, respondido_en = UTC_TIMESTAMP() WHERE id = ?', [estado, request.id]);

    const updated = (await findRequest(request.id))!;
    const message = action === 'accept' ? 'Solicitud aceptada' : 'Solicitud rechazada';
    return ok(res, message, requestToJson(updated));
  })
);

// GET /api/friends
// Mis amigos (son los que aparecen en el chat)
router.get(
  '/',
  handler(async (req, res) => {
    const me = req.userId;
    const rows = await query<Record<string, any>>(
      `SELECT u.id, u.username, u.nombre_completo, u.foto_key
         FROM amistades a
         JOIN usuarios u ON u.id = IF(a.solicitante_id = ?, a.destinatario_id, a.solicitante_id)
        WHERE a.estado = 'accepted' AND (a.solicitante_id = ? OR a.destinatario_id = ?)
        ORDER BY u.nombre_completo, u.id`,
      [me, me, me]
    );

    return ok(res, 'Amigos obtenidos', rows.map((row) => userSummary(row)));
  })
);

export default router;
