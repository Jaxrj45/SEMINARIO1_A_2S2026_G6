from flask import Blueprint, g

from db import is_duplicate, query, run
from utils.auth import require_auth
from utils.format import to_id
from utils.http import ApiError, get_body, ok
from utils.serialize import request_to_json, user_summary
from utils.validate import throw_if_invalid

friends_bp = Blueprint("friends", __name__, url_prefix="/api/friends")
friends_bp.before_request(require_auth)

# Solicitud con los datos cortos de quien la manda (s_) y de quien la recibe (d_)
REQUEST_SELECT = """
  SELECT a.id, a.estado, a.creado_en, a.solicitante_id, a.destinatario_id,
         s.id AS s_id, s.username AS s_username, s.nombre_completo AS s_nombre_completo, s.foto_key AS s_foto_key,
         d.id AS d_id, d.username AS d_username, d.nombre_completo AS d_nombre_completo, d.foto_key AS d_foto_key
    FROM amistades a
    JOIN usuarios s ON s.id = a.solicitante_id
    JOIN usuarios d ON d.id = a.destinatario_id"""


def _find_request(request_id):
    rows = query(f"{REQUEST_SELECT} WHERE a.id = %s", (request_id,))
    return rows[0] if rows else None


@friends_bp.post("/requests")
def send_request():
    me = g.user_id
    to_user_id = to_id(get_body().get("toUserId"))

    throw_if_invalid({} if to_user_id else {"toUserId": "Es obligatorio"})
    if to_user_id == me:
        raise ApiError(
            400,
            "VALIDATION_ERROR",
            "No puedes enviarte una solicitud a ti mismo",
            {"toUserId": "No puede ser tu propio usuario"},
        )

    if not query("SELECT id FROM usuarios WHERE id = %s", (to_user_id,)):
        raise ApiError(404, "NOT_FOUND", "El usuario no existe")

    # Solo hay una fila por pareja, sin importar quien la mando
    existing_rows = query(
        """SELECT id, estado FROM amistades
            WHERE usuario_menor = LEAST(%s, %s) AND usuario_mayor = GREATEST(%s, %s)""",
        (me, to_user_id, me, to_user_id),
    )
    existing = existing_rows[0] if existing_rows else None

    if existing and existing["estado"] == "accepted":
        raise ApiError(409, "ALREADY_FRIENDS", "Ya son amigos")
    elif existing and existing["estado"] == "pending":
        raise ApiError(409, "REQUEST_ALREADY_EXISTS", "Ya existe una solicitud pendiente con este usuario")
    elif existing:
        # Habia una rechazada: se reutiliza la fila
        run(
            """UPDATE amistades
                  SET solicitante_id = %s, destinatario_id = %s, estado = 'pending',
                      creado_en = UTC_TIMESTAMP(), respondido_en = NULL
                WHERE id = %s""",
            (me, to_user_id, existing["id"]),
        )
        request_id = existing["id"]
    else:
        try:
            request_id = run(
                "INSERT INTO amistades (solicitante_id, destinatario_id) VALUES (%s, %s)",
                (me, to_user_id),
            )
        except Exception as e:
            # Los dos se mandaron solicitud al mismo tiempo
            if is_duplicate(e):
                raise ApiError(
                    409, "REQUEST_ALREADY_EXISTS", "Ya existe una solicitud pendiente con este usuario"
                )
            raise

    return ok("Solicitud enviada", request_to_json(_find_request(request_id)), 201)


@friends_bp.get("/requests")
def list_requests():
    """Solo las pendientes: las que me mandaron y las que yo mande."""
    me = g.user_id
    rows = query(
        f"""{REQUEST_SELECT}
             WHERE a.estado = 'pending' AND (a.destinatario_id = %s OR a.solicitante_id = %s)
             ORDER BY a.creado_en DESC, a.id DESC""",
        (me, me),
    )

    return ok(
        "Solicitudes obtenidas",
        {
            "received": [request_to_json(r) for r in rows if r["destinatario_id"] == me],
            "sent": [request_to_json(r) for r in rows if r["solicitante_id"] == me],
        },
    )


@friends_bp.put("/requests/<request_id>")
def answer_request(request_id):
    """body: { "action": "accept" | "reject" }"""
    me = g.user_id
    request_id = to_id(request_id)
    action = get_body().get("action")

    throw_if_invalid({} if action in ("accept", "reject") else {"action": "Debe ser accept o reject"})

    friend_request = _find_request(request_id) if request_id else None
    if not friend_request:
        raise ApiError(404, "NOT_FOUND", "La solicitud no existe")
    if friend_request["destinatario_id"] != me:
        raise ApiError(403, "FORBIDDEN", "Solo quien recibe la solicitud puede responderla")
    if friend_request["estado"] != "pending":
        raise ApiError(400, "VALIDATION_ERROR", "La solicitud ya fue respondida")

    estado = "accepted" if action == "accept" else "rejected"
    run(
        "UPDATE amistades SET estado = %s, respondido_en = UTC_TIMESTAMP() WHERE id = %s",
        (estado, friend_request["id"]),
    )

    message = "Solicitud aceptada" if action == "accept" else "Solicitud rechazada"
    return ok(message, request_to_json(_find_request(friend_request["id"])))


@friends_bp.get("")
def list_friends():
    """Mis amigos (son los que aparecen en el chat)."""
    me = g.user_id
    rows = query(
        """SELECT u.id, u.username, u.nombre_completo, u.foto_key
             FROM amistades a
             JOIN usuarios u ON u.id = IF(a.solicitante_id = %s, a.destinatario_id, a.solicitante_id)
            WHERE a.estado = 'accepted' AND (a.solicitante_id = %s OR a.destinatario_id = %s)
            ORDER BY u.nombre_completo, u.id""",
        (me, me, me),
    )

    return ok("Amigos obtenidos", [user_summary(row) for row in rows])
