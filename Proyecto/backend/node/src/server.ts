import { env } from './config/env';
import express from 'express';
import cors from 'cors';
import { pool } from './config/db';
import { errorHandler, notFound } from './middleware/errors';
import healthRoutes from './routes/health';
import authRoutes from './routes/auth';
import userRoutes from './routes/users';
import friendRoutes from './routes/friends';
import commentRoutes from './routes/comments';
import postRoutes from './routes/posts';
import tagRoutes from './routes/tags';
import translateRoutes from './routes/translate';
import chatRoutes from './routes/chat';
import { attachChat } from './services/chatSocket';

const app = express();
app.disable('x-powered-by');
app.use(cors());
// El login facial manda la foto en base64 (hasta 1.5 MB, que en base64 son unos 2 MB)
app.use(express.json({ limit: '3mb' }));

app.use('/api/health', healthRoutes);

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/friends', friendRoutes);
// Va antes de /api/posts para que /api/posts/:postId/comments no lo agarre el router de publicaciones
app.use('/api/posts/:postId/comments', commentRoutes);

app.use('/api/posts', postRoutes);
app.use('/api/tags', tagRoutes);
app.use('/api/translate', translateRoutes);
app.use('/api/chat', chatRoutes);

app.use(notFound);
app.use(errorHandler);

// Antes de abrir el puerto se revisa que la base responda
pool
  .query('SELECT 1')
  .then(() => {
    const server = app.listen(env.port, '0.0.0.0', () => {
      console.log(`[node] escuchando en el puerto ${env.port}`);
    });
    // El chat (WS /api/ws) usa el mismo puerto que la API
    attachChat(server);
  })
  .catch((e) => {
    console.error('No se pudo conectar a la base de datos:', e.message);
    process.exit(1);
  });
