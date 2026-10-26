from flask import Blueprint, g, request

from db import query
from services.friends import are_friends
from utils.auth import require_auth
from utils.format import to_id
from utils.http import ApiError, ok
from utils.serialize import message_to_json

chat_bp = Blueprint("chat", __name__, url_prefix="/api/chat")
chat_bp.before_request(require_auth)

DEFAULT_LIMIT = 50
MAX_LIMIT = 100


@chat_bp.get("/<friend_id>/messages")
def list_messages(friend_id):
    """?beforeId=&limit=  Historial con un amigo, del mas viejo al mas nuevo.
    beforeId sirve para cargar mensajes anteriores."""
    me = g.user_id
    friend_id = to_id(friend_id)
    before_id = to_id(request.args.get("beforeId"))
    limit = min(to_id(request.args.get("limit")) or DEFAULT_LIMIT, MAX_LIMIT)

    if not friend_id or not query("SELECT id FROM usuarios WHERE id = %s", (friend_id,)):
        raise ApiError(404, "NOT_FOUND", "El usuario no existe")
    if not are_friends(me, friend_id):
        raise ApiError(403, "NOT_FRIENDS", "Solo puedes ver el chat con tus amigos")

    params = [me, friend_id, friend_id, me]
    before_filter = ""
    if before_id:
        before_filter = "AND id < %s"
        params.append(before_id)
    params.append(limit)

    # Se toman los ultimos "limit" y luego se voltean para que queden en orden ascendente
    rows = query(
        f"""SELECT id, emisor_id, receptor_id, texto, creado_en
              FROM mensajes
             WHERE ((emisor_id = %s AND receptor_id = %s) OR (emisor_id = %s AND receptor_id = %s)) {before_filter}
             ORDER BY id DESC
             LIMIT %s""",
        params,
    )

    return ok("Mensajes obtenidos", [message_to_json(row) for row in reversed(rows)])
