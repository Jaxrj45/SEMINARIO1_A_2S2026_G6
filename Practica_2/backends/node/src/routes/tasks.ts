import { Router } from 'express';
import { callSp } from '../config/db';
import { authRequired } from '../middleware/auth';
import { err, text } from '../utils/http';
import { TaskRow, taskToDict } from '../utils/serialize';

const router = Router();
router.use(authRequired);

router.get('/', async (req, res, next) => {
  try {
    const rows = await callSp<TaskRow>('sp_listar_tareas', req.userId);
    return res.json(rows.map(taskToDict));
  } catch (e) {
    return next(e);
  }
});

router.post('/', async (req, res, next) => {
  const data = req.body || {};
  const title = text(data.title);
  if (!title) return err(res, 'title es obligatorio', 400);
  const description = data.description === undefined ? '' : data.description;

  try {
    const [task] = await callSp<TaskRow>('sp_crear_tarea', req.userId, title, description);
    return res.status(201).json(taskToDict(task));
  } catch (e) {
    return next(e);
  }
});

router.put('/:id(\\d+)', async (req, res, next) => {
  const data = req.body || {};
  let title: string | null = null;
  if ('title' in data) {
    title = text(data.title);
    if (!title) return err(res, 'title no puede estar vacío', 400);
  }
  const setDescription = 'description' in data;

  try {
    const [task] = await callSp<TaskRow>(
      'sp_actualizar_tarea',
      req.params.id,
      req.userId,
      title,
      setDescription ? data.description : null,
      setDescription
    );
    if (!task) return err(res, 'Tarea no encontrada', 404);
    return res.json(taskToDict(task));
  } catch (e) {
    return next(e);
  }
});

// Body { completed: bool }; sin body alterna el estado actual (el SP recibe NULL)
router.patch('/:id(\\d+)/complete', async (req, res, next) => {
  const data = req.body || {};
  const completed = 'completed' in data ? Boolean(data.completed) : null;

  try {
    const [task] = await callSp<TaskRow>('sp_marcar_tarea', req.params.id, req.userId, completed);
    if (!task) return err(res, 'Tarea no encontrada', 404);
    return res.json(taskToDict(task));
  } catch (e) {
    return next(e);
  }
});

router.delete('/:id(\\d+)', async (req, res, next) => {
  try {
    const [result] = await callSp<{ deleted: boolean }>(
      'sp_eliminar_tarea',
      req.params.id,
      req.userId
    );
    if (!result.deleted) return err(res, 'Tarea no encontrada', 404);
    return res.json({ message: 'Tarea eliminada' });
  } catch (e) {
    return next(e);
  }
});

export default router;
