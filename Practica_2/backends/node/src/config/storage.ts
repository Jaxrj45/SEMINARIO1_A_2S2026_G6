import crypto from 'crypto';
import path from 'path';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { BlobServiceClient, ContainerClient } from '@azure/storage-blob';

export const PROVIDER = (process.env.STORAGE_PROVIDER || 'aws').toLowerCase();

let s3Client: S3Client | null = null;
let containerClient: ContainerClient | null = null;

async function uploadToS3(file: Express.Multer.File, key: string): Promise<string> {
  const bucket = process.env.S3_BUCKET;
  const region = process.env.AWS_REGION || 'us-east-1';
  if (!bucket) return `http://simulated-bucket/${key}`;

  if (!s3Client) s3Client = new S3Client({ region });
  await s3Client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype || 'application/octet-stream',
    })
  );
  return `https://${bucket}.s3.${region}.amazonaws.com/${key}`;
}

async function uploadToBlob(file: Express.Multer.File, key: string): Promise<string> {
  const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
  const container = process.env.AZURE_STORAGE_CONTAINER;
  if (!connectionString || !container) return `http://simulated-bucket/${key}`;

  if (!containerClient) {
    containerClient =
      BlobServiceClient.fromConnectionString(connectionString).getContainerClient(container);
  }
  const blob = containerClient.getBlockBlobClient(key);
  await blob.uploadData(file.buffer, {
    blobHTTPHeaders: { blobContentType: file.mimetype || 'application/octet-stream' },
  });
  return blob.url;
}

// Devuelve la URL publica del objeto. Key: <folder>/<uuid hex><ext>
export async function uploadFile(file: Express.Multer.File, folder: string): Promise<string> {
  const ext = path.extname(file.originalname || '');
  const key = `${folder}/${crypto.randomUUID().replace(/-/g, '')}${ext}`;
  return PROVIDER === 'azure' ? uploadToBlob(file, key) : uploadToS3(file, key);
}
