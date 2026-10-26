from flask import Blueprint, g

from db import query, run
from services.friends import are_friends
from utils.auth import require_auth
from utils.format import text, to_id
from utils.http import ApiError, get_body, ok
from utils.serialize import comment_to_json
from utils.validate import throw_if_invalid

comments_bp = Blueprint("comments", __name__, url_prefix="/api/posts/<post_id>/comments")
comments_bp.before_request(require_auth)

MAX_TEXT = 1000

COMMENT_SELECT = """
  SELECT c.id, c.publicacion_id, c.texto, c.creado_en,
         u.id AS u_id, u.username AS u_username, u.nombre_completo AS u_nombre_completo, u.foto_key AS u_foto_key
    FROM comentarios c
    JOIN usuarios u ON u.id = c.usuario_id"""


def _assert_can_comment(post_id_param, me):
    """Solo el autor de la publicacion y sus amigos pueden ver y escribir comentarios."""
    post_id = to_id(post_id_param)
    rows = query("SELECT usuario_id FROM publicaciones WHERE id = %s", (post_id,)) if post_id else []
    if not rows:
        raise ApiError(404, "NOT_FOUND", "La publicación no existe")

    author_id = rows[0]["usuario_id"]
    if author_id != me and not are_friends(me, author_id):
        raise ApiError(403, "NOT_FRIENDS", "Solo los amigos del autor pueden comentar")
    return post_id


@comments_bp.get("")
def list_comments(post_id):
    """Del mas viejo al mas nuevo."""
    post_id = _assert_can_comment(post_id, g.user_id)
    rows = query(f"{COMMENT_SELECT} WHERE c.publicacion_id = %s ORDER BY c.creado_en, c.id", (post_id,))
    return ok("Comentarios obtenidos", [comment_to_json(row) for row in rows])


@comments_bp.post("")
def create_comment(post_id):
    """body: { "text": "..." }"""
    post_id = _assert_can_comment(post_id, g.user_id)
    comment = text(get_body().get("text"))

    throw_if_invalid(
        {} if comment and len(comment) <= MAX_TEXT else {"text": f"Es obligatorio (máximo {MAX_TEXT} caracteres)"}
    )

    comment_id = run(
        "INSERT INTO comentarios (publicacion_id, usuario_id, texto) VALUES (%s, %s, %s)",
        (post_id, g.user_id, comment),
    )

    rows = query(f"{COMMENT_SELECT} WHERE c.id = %s", (comment_id,))
    return ok("Comentario publicado", comment_to_json(rows[0]), 201)
