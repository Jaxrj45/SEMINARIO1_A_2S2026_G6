import { query } from '../config/db';
import { UsuarioRow } from '../utils/serialize';

// Nunca se selecciona password_md5 para devolverlo
export const USER_COLUMNS = 'id, username, nombre_completo, email, dpi, foto_key, creado_en';

export async function findUserById(id: number): Promise<UsuarioRow | null> {
  const [user] = await query<UsuarioRow>(`SELECT ${USER_COLUMNS} FROM usuarios WHERE id = ?`, [id]);
  return user || null;
}

export async function findUserByUsername(username: string): Promise<UsuarioRow | null> {
  const [user] = await query<UsuarioRow>(`SELECT ${USER_COLUMNS} FROM usuarios WHERE username = ?`, [
    username,
  ]);
  return user || null;
}

export async function findUserByCognitoSub(sub: string): Promise<UsuarioRow | null> {
  const [user] = await query<UsuarioRow>(`SELECT ${USER_COLUMNS} FROM usuarios WHERE cognito_sub = ?`, [
    sub,
  ]);
  return user || null;
}

// La contrasena se compara dentro de MySQL con MD5
export async function passwordMatches(userId: number, password: string): Promise<boolean> {
  const [row] = await query<{ ok: number }>(
    'SELECT password_md5 = MD5(?) AS ok FROM usuarios WHERE id = ?',
    [password, userId]
  );
  return row?.ok === 1;
}
