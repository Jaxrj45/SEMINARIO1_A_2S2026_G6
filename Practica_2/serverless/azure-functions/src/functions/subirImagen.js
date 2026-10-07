// Azure Function: subir imagen al contenedor Blob de archivos.
// Entrada (JSON): { "name": "foto.png", "contentType": "image/png", "data": "<base64>" }
// Salida 201:     { "url": "https://...", "name": "foto.png", "type": "image" }
// App settings: AZURE_STORAGE_CONNECTION_STRING, AZURE_STORAGE_CONTAINER
const { app } = require('@azure/functions');
const crypto = require('crypto');
const path = require('path');
const { BlobServiceClient } = require('@azure/storage-blob');

const MAX_BYTES = 4 * 1024 * 1024;
const json = (status, body) => ({ status, jsonBody: body });

app.http('subirImagen', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'imagenes',
  handler: async (request, context) => {
    let payload;
    try {
      payload = await request.json();
    } catch {
      return json(400, { error: 'El cuerpo debe ser JSON valido' });
    }

    const { name, contentType, data } = payload || {};
    if (!name || !contentType || !data) {
      return json(400, { error: 'Faltan name, contentType o data' });
    }
    if (!String(contentType).startsWith('image/')) {
      return json(400, { error: 'Solo se permiten imagenes (image/*)' });
    }

    const buffer = Buffer.from(data, 'base64');
    if (buffer.length === 0 || buffer.length > MAX_BYTES) {
      return json(400, { error: 'Archivo vacio o mayor a 4 MB' });
    }

    const key = `images/${crypto.randomUUID().replace(/-/g, '')}${path.extname(name)}`;
    try {
      const container = BlobServiceClient.fromConnectionString(
        process.env.AZURE_STORAGE_CONNECTION_STRING
      ).getContainerClient(process.env.AZURE_STORAGE_CONTAINER);
      const blob = container.getBlockBlobClient(key);
      await blob.uploadData(buffer, { blobHTTPHeaders: { blobContentType: contentType } });
      return json(201, { url: blob.url, name, type: 'image' });
    } catch (err) {
      context.error(err);
      return json(500, { error: 'No se pudo subir a Blob Storage' });
    }
  },
});
