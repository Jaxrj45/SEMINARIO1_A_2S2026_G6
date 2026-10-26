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

export interface PublicacionRow {
  id: number;
  descripcion: string | null;
  imagen_key: string;
  comment_count: number;
  creado_en: Date;
  [key: string]: any;
}

export interface MensajeRow {
  id: number;
  emisor_id: number;
  receptor_id: number;
  texto: string;
  creado_en: Date;
}

export const messageToJson = (row: MensajeRow) => ({
  id: row.id,
  fromUserId: row.emisor_id,
  toUserId: row.receptor_id,
  text: row.texto,
  createdAt: toIso(row.creado_en),
});

export const postToJson = (row: PublicacionRow, labels: string[]) => ({
  id: row.id,
  author: userSummary(row, 'u_'),
  description: row.descripcion,
  imageUrl: s3Url(row.imagen_key),
  labels,
  commentCount: Number(row.comment_count),
  createdAt: toIso(row.creado_en),
});
