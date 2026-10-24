import { Router } from 'express';
import { ok } from '../utils/http';

const router = Router();

// Lo usa el Target Group del balanceador. server dice quien respondio.
router.get('/', (req, res) => ok(res, 'OK', { server: 'node' }));

export default router;
