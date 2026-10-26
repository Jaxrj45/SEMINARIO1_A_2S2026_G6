import { Server } from 'http';
import { RawData, WebSocket, WebSocketServer } from 'ws';
import { query, run } from '../config/db';
import { readToken } from '../middleware/auth';
import { text, toId } from '../utils/format';
import { MensajeRow, messageToJson } from '../utils/serialize';
import { areFriends } from './friends';

// Chat en tiempo real: WS /api/ws?token=<token>
//
// El mensaje se guarda en RDS y no se manda directo al otro usuario, porque puede estar
// conectado a la otra EC2. Cada EC2 revisa cada segundo los mensajes nuevos y se los manda
// a los dos usuarios del chat que tenga conectados. El frontend descarta repetidos por id.

const POLL_MS = 1000;
// Ping de protocolo cada 30 s: el balanceador corta las conexiones con 60 s sin actividad
const PING_MS = 30000;
// Un INSERT puede hacerse visible despues de otro con id mayor (la otra EC2 escribe al mismo tiempo),
// asi que tambien se revisan los mensajes de los ultimos segundos y no solo los de id mayor
const RECENT_SECONDS = 10;
const MAX_TEXT = 2000; // largo de mensajes.texto

// Sockets abiertos en esta EC2, por usuario (puede tener varias pestanas)
const sockets = new Map<number, Set<WebSocket>>();
const alive = new WeakMap<WebSocket, boolean>();

function send(ws: WebSocket, payload: unknown) {
  if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(payload));
}

function sendError(ws: WebSocket, code: string, message: string) {
  send(ws, { type: 'error', data: { code, message } });
}

function deliver(row: MensajeRow) {
  const payload = { type: 'message', data: messageToJson(row) };
  for (const userId of new Set([row.emisor_id, row.receptor_id])) {
    for (const ws of sockets.get(userId) || []) send(ws, payload);
  }
}

// ---------------------------------------------------------------------------
// Sondeo de mensajes nuevos
// ---------------------------------------------------------------------------

let lastId = 0;
// Ids que ya se mandaron y que todavia caen en la ventana de los ultimos segundos
let delivered = new Set<number>();

function loadRecent() {
  return query<MensajeRow>(
    `SELECT id, emisor_id, receptor_id, texto, creado_en
       FROM mensajes
      WHERE id > ? OR creado_en >= UTC_TIMESTAMP() - INTERVAL ${RECENT_SECONDS} SECOND
      ORDER BY id`,
    [lastId]
  );
}

async function poll() {
  const rows = await loadRecent();
  for (const row of rows) {
    if (!delivered.has(row.id)) deliver(row);
  }
  delivered = new Set(rows.map((row) => row.id));
  if (rows.length > 0) lastId = Math.max(lastId, rows[rows.length - 1].id);
}

async function startPolling() {
  // Al arrancar no se reenvia nada de lo que ya estaba guardado
  const [row] = await query<{ maxId: number | null }>('SELECT MAX(id) AS maxId FROM mensajes');
  lastId = row?.maxId || 0;
  delivered = new Set((await loadRecent()).map((r) => r.id));

  const tick = async () => {
    try {
      await poll();
    } catch (e) {
      console.error('[chat] no se pudieron leer los mensajes nuevos:', e);
    } finally {
      setTimeout(tick, POLL_MS);
    }
  };
  setTimeout(tick, POLL_MS);
}

// ---------------------------------------------------------------------------
// Mensajes que manda el navegador
// ---------------------------------------------------------------------------

async function onMessage(ws: WebSocket, me: number, raw: RawData) {
  let msg: any;
  try {
    msg = JSON.parse(raw.toString());
  } catch {
    return sendError(ws, 'VALIDATION_ERROR', 'El mensaje no es un JSON válido');
  }

  if (msg?.type === 'ping') return send(ws, { type: 'pong' });
  if (msg?.type !== 'message') return sendError(ws, 'VALIDATION_ERROR', 'Tipo de mensaje no soportado');

  const toUserId = toId(msg.data?.toUserId);
  const content = text(msg.data?.text);
  if (!toUserId || !content || content.length > MAX_TEXT) {
    return sendError(ws, 'VALIDATION_ERROR', `El mensaje necesita toUserId y un texto de máximo ${MAX_TEXT} caracteres`);
  }
  if (!(await areFriends(me, toUserId))) {
    return sendError(ws, 'NOT_FRIENDS', 'Solo puedes escribir a tus amigos');
  }

  // Lo entrega el sondeo, en esta EC2 y en la otra
  await run('INSERT INTO mensajes (emisor_id, receptor_id, texto) VALUES (?, ?, ?)', [me, toUserId, content]);
}

export function attachChat(server: Server) {
  const wss = new WebSocketServer({ server, path: '/api/ws', maxPayload: 64 * 1024 });

  wss.on('connection', (ws, req) => {
    // El navegador no deja mandar headers por WebSocket, por eso el token viene en la URL
    const token = new URL(req.url || '', 'http://localhost').searchParams.get('token') || '';
    let me: number;
    try {
      me = readToken(token).userId;
    } catch {
      ws.close(4401, 'Sesión inválida');
      return;
    }

    if (!sockets.has(me)) sockets.set(me, new Set());
    sockets.get(me)!.add(ws);
    alive.set(ws, true);

    ws.on('pong', () => alive.set(ws, true));
    ws.on('message', (raw) => {
      onMessage(ws, me, raw).catch((e) => {
        console.error('[chat] error al guardar el mensaje:', e);
        sendError(ws, 'INTERNAL_ERROR', 'No se pudo enviar el mensaje');
      });
    });
    ws.on('close', () => {
      const userSockets = sockets.get(me);
      userSockets?.delete(ws);
      if (userSockets?.size === 0) sockets.delete(me);
    });
  });

  // Si un navegador no contesto el ping anterior, la conexion se da por muerta
  const pinger = setInterval(() => {
    for (const ws of wss.clients) {
      if (!alive.get(ws)) {
        ws.terminate();
        continue;
      }
      alive.set(ws, false);
      ws.ping();
    }
  }, PING_MS);
  wss.on('close', () => clearInterval(pinger));

  startPolling().catch((e) => {
    console.error('[chat] no se pudo iniciar el sondeo de mensajes:', e);
    process.exit(1);
  });
}
