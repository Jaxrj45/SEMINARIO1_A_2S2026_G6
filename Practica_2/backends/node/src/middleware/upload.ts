import multer from 'multer';

export const MAX_FILE_MB = 10;

export const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_MB * 1024 * 1024 },
});

// Multer decodifica el nombre como latin1; se reinterpreta como UTF-8 para conservar tildes
export function originalName(file: Express.Multer.File): string {
  return Buffer.from(file.originalname, 'latin1').toString('utf8');
}
