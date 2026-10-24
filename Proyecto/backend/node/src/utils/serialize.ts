import { s3Url, toIso } from './format';

// Filas de MySQL (nombres de la base) -> JSON del contrato (nombres en ingles)

export interface UsuarioRow {
  id: number;
  username: string;
  nombre_completo: string;
  email: string;
  dpi: string;
  foto_key: string;
  creado_en: Date;
}

// Perfil completo, solo para el propio usuario
export const userToJson = (u: UsuarioRow) => ({
  id: u.id,
  username: u.username,
  fullName: u.nombre_completo,
  email: u.email,
  dpi: u.dpi,
  photoUrl: s3Url(u.foto_key),
  createdAt: toIso(u.creado_en),
});

// Version corta para mostrar a otros usuarios (sin correo ni DPI).
// prefix sirve cuando la consulta trae dos usuarios, ej. s_id y d_id.
export const userSummary = (row: Record<string, any>, prefix = '') => ({
  id: row[`${prefix}id`] as number,
  username: row[`${prefix}username`] as string,
  fullName: row[`${prefix}nombre_completo`] as string,
  photoUrl: s3Url(row[`${prefix}foto_key`]),
});

export interface SolicitudRow {
  id: number;
  estado: 'pending' | 'accepted' | 'rejected';
  creado_en: Date;
  [key: string]: any;
}

export const requestToJson = (row: SolicitudRow) => ({
  id: row.id,
  fromUser: userSummary(row, 's_'),
  toUser: userSummary(row, 'd_'),
  status: row.estado,
  createdAt: toIso(row.creado_en),
});

export interface ComentarioRow {
  id: number;
  publicacion_id: number;
  texto: string;
  creado_en: Date;
  [key: string]: any;
}

export const commentToJson = (row: ComentarioRow) => ({
  id: row.id,
  postId: row.publicacion_id,
  author: userSummary(row, 'u_'),
  text: row.texto,
  createdAt: toIso(row.creado_en),
});
