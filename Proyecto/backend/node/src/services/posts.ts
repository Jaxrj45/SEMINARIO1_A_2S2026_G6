import { query } from '../config/db';
import { postToJson, PublicacionRow } from '../utils/serialize';

// Publicaciones que puede ver un usuario: las suyas y las de sus amigos.
// Espera la publicacion como p y recibe [me, me, me].
export const VISIBLE_TO = `
  (p.usuario_id = ? OR EXISTS (
     SELECT 1 FROM amistades a
      WHERE a.usuario_menor = LEAST(p.usuario_id, ?)
        AND a.usuario_mayor = GREATEST(p.usuario_id, ?)
        AND a.estado = 'accepted'))`;

const POST_SELECT = `
  SELECT p.id, p.descripcion, p.imagen_key, p.creado_en,
         u.id AS u_id, u.username AS u_username, u.nombre_completo AS u_nombre_completo, u.foto_key AS u_foto_key,
         (SELECT COUNT(*) FROM comentarios c WHERE c.publicacion_id = p.id) AS comment_count
    FROM publicaciones p
    JOIN usuarios u ON u.id = p.usuario_id`;

// Etiquetas de varias publicaciones en una sola consulta, en orden alfabetico
async function labelsByPost(postIds: number[]): Promise<Map<number, string[]>> {
  const labels = new Map<number, string[]>(postIds.map((id) => [id, []]));
  if (postIds.length === 0) return labels;

  const rows = await query<{ publicacion_id: number; nombre: string }>(
    `SELECT pe.publicacion_id, e.nombre
       FROM publicacion_etiquetas pe
       JOIN etiquetas e ON e.id = pe.etiqueta_id
      WHERE pe.publicacion_id IN (?)
      ORDER BY e.nombre`,
    [postIds]
  );
  for (const row of rows) labels.get(row.publicacion_id)!.push(row.nombre);
  return labels;
}

async function withLabels(rows: PublicacionRow[]) {
  const labels = await labelsByPost(rows.map((row) => row.id));
  return rows.map((row) => postToJson(row, labels.get(row.id)!));
}

// Feed: mis publicaciones y las de mis amigos, de la mas nueva a la mas vieja.
// Con tag solo las que tienen esa etiqueta (sin tag es el filtro "Todos").
export async function findFeed(me: number, tag: string) {
  const params: unknown[] = [me, me, me];
  let filter = '';
  if (tag) {
    filter = `AND EXISTS (
      SELECT 1 FROM publicacion_etiquetas pe
        JOIN etiquetas e ON e.id = pe.etiqueta_id
       WHERE pe.publicacion_id = p.id AND e.nombre = ?)`;
    params.push(tag);
  }

  const rows = await query<PublicacionRow>(
    `${POST_SELECT} WHERE ${VISIBLE_TO} ${filter} ORDER BY p.creado_en DESC, p.id DESC`,
    params
  );
  return withLabels(rows);
}

export async function findPostById(id: number) {
  const rows = await query<PublicacionRow>(`${POST_SELECT} WHERE p.id = ?`, [id]);
  const [post] = await withLabels(rows);
  return post || null;
}
