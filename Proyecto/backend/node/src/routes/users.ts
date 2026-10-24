import { Router } from 'express';
import { isDuplicate, pool, query } from '../config/db';
import { authRequired } from '../middleware/auth';
import { updateCognitoUser } from '../services/cognito';
import { findUserById, passwordMatches } from '../services/users';
import { text } from '../utils/format';
import { handler } from '../utils/handler';
import { ApiError, ok } from '../utils/http';
import { userSummary, userToJson } from '../utils/serialize';
import { DPI_RE, likePattern, throwIfInvalid } from '../utils/validate';

const router = Router();
router.use(authRequired);

// GET /api/users/me
router.get(
  '/me',
  handler(async (req, res) => {
    const user = await findUserById(req.userId);
    if (!user) throw new ApiError(404, 'NOT_FOUND', 'El usuario no existe');
    return ok(res, 'Perfil obtenido', userToJson(user));
  })
);

// PUT /api/users/me
// Solo se guarda si la contrasena es correcta. Nombre y DPI tambien se actualizan en Cognito.
router.put(
  '/me',
  handler(async (req, res) => {
    const body = req.body || {};
    const password = typeof body.password === 'string' ? body.password : '';

    // Solo se cambia lo que venga en el body
    const changes: { fullName?: string; dpi?: string; photoKey?: string } = {};
    if (body.fullName !== undefined) changes.fullName = text(body.fullName);
    if (body.dpi !== undefined) changes.dpi = text(body.dpi);
    if (body.photoKey !== undefined) changes.photoKey = text(body.photoKey);

    const fields: Record<string, string> = {};
    if (!password) fields.password = 'Escribe tu contraseña para guardar los cambios';
    if (changes.fullName !== undefined && (!changes.fullName || changes.fullName.length > 150)) {
      fields.fullName = 'Es obligatorio (máximo 150 caracteres)';
    }
    if (changes.dpi !== undefined && !DPI_RE.test(changes.dpi)) fields.dpi = 'Debe tener 13 dígitos';
    if (changes.photoKey !== undefined && !changes.photoKey.startsWith('Fotos_Perfil/')) {
      fields.photoKey = 'Foto de perfil inválida';
    }
    throwIfInvalid(fields);

    const current = await findUserById(req.userId);
    if (!current) throw new ApiError(404, 'NOT_FOUND', 'El usuario no existe');

    if (!(await passwordMatches(req.userId, password))) {
      throw new ApiError(403, 'INVALID_PASSWORD', 'La contraseña es incorrecta');
    }

    const sets: string[] = [];
    const params: unknown[] = [];
    if (changes.fullName !== undefined) {
      sets.push('nombre_completo = ?');
      params.push(changes.fullName);
    }
    if (changes.dpi !== undefined) {
      sets.push('dpi = ?');
      params.push(changes.dpi);
    }
    if (changes.photoKey !== undefined) {
      sets.push('foto_key = ?');
      params.push(changes.photoKey);
    }

    if (sets.length > 0) {
      // RDS y Cognito tienen que quedar iguales: si Cognito falla se deshace el cambio en RDS
      const connection = await pool.getConnection();
      try {
        await connection.beginTransaction();
        await connection.query(`UPDATE usuarios SET ${sets.join(', ')} WHERE id = ?`, [...params, req.userId]);
        await updateCognitoUser(current.username, { fullName: changes.fullName, dpi: changes.dpi });
        await connection.commit();
      } catch (e) {
        await connection.rollback();
        if (isDuplicate(e)) {
          throw new ApiError(409, 'ALREADY_EXISTS', 'El DPI ya está registrado', { dpi: 'Ya está registrado' });
        }
        throw e;
      } finally {
        connection.release();
      }
    }

    const user = (await findUserById(req.userId))!;
    return ok(res, 'Perfil actualizado', userToJson(user));
  })
);

// GET /api/users/discover?q=
// Usuarios que no son mis amigos (sin contarme a mi), con el estado de la solicitud entre los dos
router.get(
  '/discover',
  handler(async (req, res) => {
    const me = req.userId;
    const search = text(req.query.q);

    const params: unknown[] = [me, me, me];
    let filter = '';
    if (search) {
      filter = 'AND (u.username LIKE ? OR u.nombre_completo LIKE ?)';
      params.push(likePattern(search), likePattern(search));
    }

    const rows = await query<Record<string, any>>(
      `SELECT u.id, u.username, u.nombre_completo, u.foto_key, a.estado, a.solicitante_id
         FROM usuarios u
         LEFT JOIN amistades a
           ON a.usuario_menor = LEAST(u.id, ?) AND a.usuario_mayor = GREATEST(u.id, ?)
        WHERE u.id <> ?
          AND (a.estado IS NULL OR a.estado <> 'accepted')
          ${filter}
        ORDER BY u.nombre_completo, u.id
        LIMIT 100`,
      params
    );

    const users = rows.map((row) => {
      let requestStatus = 'none'; // sin solicitud, o una rechazada (se puede volver a mandar)
      if (row.estado === 'pending') requestStatus = row.solicitante_id === me ? 'sent' : 'received';
      return { ...userSummary(row), requestStatus };
    });

    return ok(res, 'Usuarios obtenidos', users);
  })
);

export default router;
