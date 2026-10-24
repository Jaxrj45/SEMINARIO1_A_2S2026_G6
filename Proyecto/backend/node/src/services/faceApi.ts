import { env } from '../config/env';
import { ApiError } from '../utils/http';

// Llama a la Lambda face-compare por API Gateway (POST {UPLOAD_API}/face/compare)
export async function compareFace(
  sourceBase64: string,
  targetKey: string
): Promise<{ match: boolean; similarity: number }> {
  if (!env.uploadApi || !env.faceApiKey) {
    throw new ApiError(502, 'UPSTREAM_ERROR', 'El login facial no está configurado en el servidor');
  }

  let response: Response;
  try {
    response = await fetch(`${env.uploadApi}/face/compare`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': env.faceApiKey },
      body: JSON.stringify({ sourceBase64, targetKey }),
      signal: AbortSignal.timeout(20000),
    });
  } catch (e) {
    console.error('[face] no hubo respuesta de /face/compare:', e);
    throw new ApiError(502, 'UPSTREAM_ERROR', 'No se pudo comparar el rostro');
  }

  const body: any = await response.json().catch(() => null);

  if (response.status === 422 || body?.data?.code === 'NO_FACE_DETECTED') {
    throw new ApiError(422, 'NO_FACE_DETECTED', 'No se detectó un rostro en la imagen');
  }
  if (!response.ok || body?.status !== 'success') {
    console.error('[face] /face/compare respondio', response.status, body);
    throw new ApiError(502, 'UPSTREAM_ERROR', 'No se pudo comparar el rostro');
  }

  return {
    match: Boolean(body.data?.match),
    similarity: Number(body.data?.similarity || 0),
  };
}
