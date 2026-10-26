"""Chat en tiempo real: WS /api/ws?token=<token>

El mensaje se guarda en RDS y no se manda directo al otro usuario, porque puede estar
conectado a la otra EC2. Cada EC2 revisa cada segundo los mensajes nuevos y se los manda
a los dos usuarios del chat que tenga conectados. El frontend descarta repetidos por id."""

import json
import threading
import time

import jwt
from flask import request
from flask_sock import Sock

from db import query, run
from services.friends import are_friends
from utils.auth import read_token
from utils.format import text, to_id
from utils.serialize import message_to_json

POLL_SECONDS = 1
# Ping de protocolo cada 30 s: el balanceador corta las conexiones con 60 s sin actividad
PING_SECONDS = 30
# Un INSERT puede hacerse visible despues de otro con id mayor (la otra EC2 escribe al mismo tiempo),
# asi que tambien se revisan los mensajes de los ultimos segundos y no solo los de id mayor
RECENT_SECONDS = 10
MAX_TEXT = 2000  # largo de mensajes.texto

RECENT_SELECT = f"""
  SELECT id, emisor_id, receptor_id, texto, creado_en
    FROM mensajes
   WHERE id > %s OR creado_en >= UTC_TIMESTAMP() - INTERVAL {RECENT_SECONDS} SECOND
   ORDER BY id"""

sock = Sock()

# Sockets abiertos en este proceso, por usuario (puede tener varias pestanas)
_sockets = {}
_sockets_lock = threading.Lock()


class _Connection:
    """El hilo del sondeo y el de la conexion pueden escribir al mismo tiempo, por eso el lock."""

    def __init__(self, ws):
        self.ws = ws
        self.lock = threading.Lock()

    def send(self, payload):
        try:
            with self.lock:
                self.ws.send(json.dumps(payload, ensure_ascii=False))
        except Exception:
            pass  # la conexion ya se cerro; se quita cuando termina su handler

    def error(self, code, message):
        self.send({"type": "error", "data": {"code": code, "message": message}})


def _deliver(row):
    payload = {"type": "message", "data": message_to_json(row)}
    with _sockets_lock:
        targets = [conn for user_id in {row["emisor_id"], row["receptor_id"]} for conn in _sockets.get(user_id, ())]
    for conn in targets:
        conn.send(payload)


# ---------------------------------------------------------------------------
# Sondeo de mensajes nuevos
# ---------------------------------------------------------------------------


def _poll_forever():
    last_id = None
    delivered = set()  # ids que ya se mandaron y que todavia caen en la ventana de los ultimos segundos
    while True:
        try:
            if last_id is None:
                # Al arrancar no se reenvia nada de lo que ya estaba guardado
                last_id = query("SELECT MAX(id) AS max_id FROM mensajes")[0]["max_id"] or 0
                delivered = {row["id"] for row in query(RECENT_SELECT, (last_id,))}
            else:
                rows = query(RECENT_SELECT, (last_id,))
                for row in rows:
                    if row["id"] not in delivered:
                        _deliver(row)
                delivered = {row["id"] for row in rows}
                if rows:
                    last_id = max(last_id, rows[-1]["id"])
        except Exception as e:
            print("[chat] no se pudieron leer los mensajes nuevos:", e)
        time.sleep(POLL_SECONDS)


# ---------------------------------------------------------------------------
# Mensajes que manda el navegador
# ---------------------------------------------------------------------------


def _on_message(conn, me, raw):
    try:
        msg = json.loads(raw)
    except (TypeError, ValueError):
        return conn.error("VALIDATION_ERROR", "El mensaje no es un JSON válido")

    msg_type = msg.get("type") if isinstance(msg, dict) else None
    if msg_type == "ping":
        return conn.send({"type": "pong"})
    if msg_type != "message":
        return conn.error("VALIDATION_ERROR", "Tipo de mensaje no soportado")

    data = msg.get("data") if isinstance(msg.get("data"), dict) else {}
    to_user_id = to_id(data.get("toUserId"))
    content = text(data.get("text"))
    if not to_user_id or not content or len(content) > MAX_TEXT:
        return conn.error(
            "VALIDATION_ERROR", f"El mensaje necesita toUserId y un texto de máximo {MAX_TEXT} caracteres"
        )
    if not are_friends(me, to_user_id):
        return conn.error("NOT_FRIENDS", "Solo puedes escribir a tus amigos")

    # Lo entrega el sondeo, en esta EC2 y en la otra
    run("INSERT INTO mensajes (emisor_id, receptor_id, texto) VALUES (%s, %s, %s)", (me, to_user_id, content))


@sock.route("/api/ws")
def chat_ws(ws):
    # El navegador no deja mandar headers por WebSocket, por eso el token viene en la URL
    try:
        me, _ = read_token(request.args.get("token", ""))
    except jwt.InvalidTokenError:
        ws.close(reason=4401, message="Sesión inválida")
        return

    conn = _Connection(ws)
    with _sockets_lock:
        _sockets.setdefault(me, set()).add(conn)
    try:
        while True:
            raw = ws.receive()  # cuando el navegador cierra lanza ConnectionClosed y flask-sock lo atrapa
            try:
                _on_message(conn, me, raw)
            except Exception as e:
                print("[chat] error al guardar el mensaje:", e)
                conn.error("INTERNAL_ERROR", "No se pudo enviar el mensaje")
    finally:
        with _sockets_lock:
            user_sockets = _sockets.get(me)
            user_sockets.discard(conn)
            if not user_sockets:
                _sockets.pop(me, None)


def init_chat(app):
    # simple-websocket manda el ping y cierra la conexion si el navegador no contesta
    app.config["SOCK_SERVER_OPTIONS"] = {"ping_interval": PING_SECONDS, "max_message_size": 64 * 1024}
    sock.init_app(app)
    # Cada worker de gunicorn tiene sus propias conexiones, asi que cada uno hace su sondeo
    threading.Thread(target=_poll_forever, name="chat-poll", daemon=True).start()
