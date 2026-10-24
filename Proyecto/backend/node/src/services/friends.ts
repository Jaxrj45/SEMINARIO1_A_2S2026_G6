import { query } from '../config/db';

// true si los dos usuarios son amigos (solicitud aceptada).
// Tambien lo puede usar el chat para validar a quien se le escribe.
export async function areFriends(userA: number, userB: number): Promise<boolean> {
  const rows = await query(
    `SELECT 1 FROM amistades
      WHERE usuario_menor = LEAST(?, ?)
        AND usuario_mayor = GREATEST(?, ?)
        AND estado = 'accepted'
      LIMIT 1`,
    [userA, userB, userA, userB]
  );
  return rows.length > 0;
}
