import { Router } from 'express';
import { callSp } from '../config/db';
import { uploadFile } from '../config/storage';
import { authRequired } from '../middleware/auth';
import { upload, originalName } from '../middleware/upload';
import { err, text } from '../utils/http';
import { FileRow, fileToDict, fileCategory } from '../utils/serialize';

const router = Router();
router.use(authRequired);

const FILE_TYPES = new Set(['image', 'text', 'other']);

router.get('/', async (req, res, next) => {
  try {
    const rows = await callSp<FileRow>('sp_listar_archivos', req.userId);
    return res.json(rows.map(fileToDict));
  } catch (e) {
    return next(e);
  }
});

// Dos modos:
//  - multipart/form-data con el campo "file": el servidor lo sube a S3/Blob con el SDK.
//  - JSON { name, type, url }: el archivo ya fue subido por Lambda / Azure Functions
//    y solo se registra su URL para que aparezca en el listado del usuario.
router.post('/', upload.single('file'), async (req, res, next) => {
  let name: string;
  let type: string;
  let url: string;

  try {
    if (req.file) {
      name = originalName(req.file);
      if (!name) return err(res, "Se requiere el campo 'file'", 400);
      type = fileCategory(req.file.mimetype);
      url = await uploadFile(req.file, `files/${req.userId}`);
    } else {
      const data = req.body || {};
      name = text(data.name);
      url = text(data.url);
      type = text(data.type) || 'other';
      if (!name || !url) {
        return err(res, "Se requiere el campo 'file' o los campos name y url", 400);
      }
      if (!/^https?:\/\//i.test(url)) return err(res, 'url debe ser http(s)', 400);
      if (!FILE_TYPES.has(type)) return err(res, 'type debe ser image, text u other', 400);
    }

    const [file] = await callSp<FileRow>('sp_registrar_archivo', req.userId, name, type, url);
    return res.status(201).json(fileToDict(file));
  } catch (e) {
    return next(e);
  }
});

router.get('/:id(\\d+)', async (req, res, next) => {
  try {
    const [file] = await callSp<FileRow>('sp_obtener_archivo', req.params.id, req.userId);
    if (!file) return err(res, 'Archivo no encontrado', 404);
    return res.json(fileToDict(file));
  } catch (e) {
    return next(e);
  }
});

export default router;
