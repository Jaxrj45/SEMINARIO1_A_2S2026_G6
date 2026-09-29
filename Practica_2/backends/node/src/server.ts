import 'dotenv/config';
import express, { NextFunction, Request, Response } from 'express';
import cors from 'cors';
import { pool } from './config/db';
import { MAX_FILE_MB } from './middleware/upload';
import authRoutes from './routes/auth';
import taskRoutes from './routes/tasks';
import fileRoutes from './routes/files';
import { err } from './utils/http';

const app = express();
app.use(cors());
app.use(express.json());
// Flask acepta formularios sin archivo en request.form; aqui igual
app.use(express.urlencoded({ extended: false }));

const PORT = Number(process.env.PORT || 5000);
const SERVER_NAME = 'node';

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', server: SERVER_NAME });
});

app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/files', fileRoutes);

app.use((req, res) => err(res, 'Endpoint no encontrado', 404));

// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((error: any, req: Request, res: Response, next: NextFunction) => {
  if (error?.code === 'LIMIT_FILE_SIZE') {
    return err(res, `Archivo demasiado grande (máx ${MAX_FILE_MB} MB)`, 413);
  }
  if (error?.name === 'MulterError') {
    return err(res, `Error al subir el archivo: ${error.message}`, 400);
  }
  if (error?.type === 'entity.parse.failed') {
    return err(res, 'JSON inválido', 400);
  }
  console.error('Error no manejado:', error);
  return err(res, 'Error interno del servidor', 500);
});

pool
  .query('SELECT 1')
  .then(() => {
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`[${SERVER_NAME}] escuchando en el puerto ${PORT}`);
    });
  })
  .catch((e) => {
    console.error('No se pudo conectar a la base de datos:', e.message);
    process.exit(1);
  });
