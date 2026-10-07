// Lambda: subir documento de texto al bucket S3 de archivos.
// Entrada (JSON): { "name": "nota.txt", "contentType": "text/plain", "data": "<base64>" }
// Salida 201:     { "url": "https://...", "name": "nota.txt", "type": "text" }
// Variables de entorno: S3_BUCKET, AWS_REGION (la define Lambda sola)
import crypto from 'node:crypto';
import path from 'node:path';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const s3 = new S3Client({});
const MAX_BYTES = 4 * 1024 * 1024;

const respond = (statusCode, body) => ({
  statusCode,
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body),
});

export const handler = async (event) => {
  let payload;
  try {
    const raw = event.isBase64Encoded
      ? Buffer.from(event.body || '', 'base64').toString('utf8')
      : event.body || '';
    payload = JSON.parse(raw);
  } catch {
    return respond(400, { error: 'El cuerpo debe ser JSON valido' });
  }

  const { name, contentType, data } = payload;
  if (!name || !contentType || !data) {
    return respond(400, { error: 'Faltan name, contentType o data' });
  }
  if (!String(contentType).startsWith('text/')) {
    return respond(400, { error: 'Solo se permiten documentos de texto (text/*)' });
  }

  const buffer = Buffer.from(data, 'base64');
  if (buffer.length === 0 || buffer.length > MAX_BYTES) {
    return respond(400, { error: 'Archivo vacio o mayor a 4 MB' });
  }

  const bucket = process.env.S3_BUCKET;
  const region = process.env.AWS_REGION;
  const key = `texts/${crypto.randomUUID().replace(/-/g, '')}${path.extname(name)}`;

  try {
    await s3.send(
      new PutObjectCommand({ Bucket: bucket, Key: key, Body: buffer, ContentType: contentType })
    );
  } catch (err) {
    console.error(err);
    return respond(500, { error: 'No se pudo subir a S3' });
  }

  return respond(201, {
    url: `https://${bucket}.s3.${region}.amazonaws.com/${key}`,
    name,
    type: 'text',
  });
};
