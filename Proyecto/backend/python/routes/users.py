from flask import Blueprint, g, request

from db import is_duplicate, query, transaction
from services.cognito import update_cognito_user
from services.users import find_user_by_id, password_matches
from utils.auth import require_auth
from utils.format import text
from utils.http import ApiError, get_body, ok
from utils.serialize import user_summary, user_to_json
from utils.validate import DPI_RE, like_pattern, throw_if_invalid

users_bp = Blueprint("users", __name__, url_prefix="/api/users")
users_bp.before_request(require_auth)


@users_bp.get("/me")
def get_me():
    user = find_user_by_id(g.user_id)
    if not user:
        raise ApiError(404, "NOT_FOUND", "El usuario no existe")
    return ok("Perfil obtenido", user_to_json(user))


@users_bp.put("/me")
def update_me():
    """Solo se guarda si la contrasena es correcta. Nombre y DPI tambien se actualizan en Cognito."""
    body = get_body()
    password = body.get("password") if isinstance(body.get("password"), str) else ""

    # Solo se cambia lo que venga en el body
    changes = {}
    if "fullName" in body:
        changes["fullName"] = text(body["fullName"])
    if "dpi" in body:
        changes["dpi"] = text(body["dpi"])
    if "photoKey" in body:
        changes["photoKey"] = text(body["photoKey"])

    fields = {}
    if not password:
        fields["password"] = "Escribe tu contraseña para guardar los cambios"
    if "fullName" in changes and (not changes["fullName"] or len(changes["fullName"]) > 150):
        fields["fullName"] = "Es obligatorio (máximo 150 caracteres)"
    if "dpi" in changes and not DPI_RE.fullmatch(changes["dpi"]):
        fields["dpi"] = "Debe tener 13 dígitos"
    if "photoKey" in changes and not changes["photoKey"].startswith("Fotos_Perfil/"):
        fields["photoKey"] = "Foto de perfil inválida"
    throw_if_invalid(fields)

    current = find_user_by_id(g.user_id)
    if not current:
        raise ApiError(404, "NOT_FOUND", "El usuario no existe")

    if not password_matches(g.user_id, password):
        raise ApiError(403, "INVALID_PASSWORD", "La contraseña es incorrecta")

    columns = {"fullName": "nombre_completo", "dpi": "dpi", "photoKey": "foto_key"}
    sets = [f"{columns[key]} = %s" for key in changes]
    params = list(changes.values())

    if sets:
        # RDS y Cognito tienen que quedar iguales: si Cognito falla se deshace el cambio en RDS
        try:
            with transaction() as cur:
                cur.execute(f"UPDATE usuarios SET {', '.join(sets)} WHERE id = %s", (*params, g.user_id))
                update_cognito_user(current["username"], changes.get("fullName"), changes.get("dpi"))
        except Exception as e:
            if is_duplicate(e):
                raise ApiError(409, "ALREADY_EXISTS", "El DPI ya está registrado", {"dpi": "Ya está registrado"})
            raise

    return ok("Perfil actualizado", user_to_json(find_user_by_id(g.user_id)))


@users_bp.get("/discover")
def discover():
    """Usuarios que no son mis amigos (sin contarme a mi), con el estado de la solicitud entre los dos."""
    me = g.user_id
    search = text(request.args.get("q"))

    params = [me, me, me]
    search_filter = ""
    if search:
        search_filter = "AND (u.username LIKE %s OR u.nombre_completo LIKE %s)"
        params += [like_pattern(search), like_pattern(search)]

    rows = query(
        f"""SELECT u.id, u.username, u.nombre_completo, u.foto_key, a.estado, a.solicitante_id
              FROM usuarios u
              LEFT JOIN amistades a
                ON a.usuario_menor = LEAST(u.id, %s) AND a.usuario_mayor = GREATEST(u.id, %s)
             WHERE u.id <> %s
               AND (a.estado IS NULL OR a.estado <> 'accepted')
               {search_filter}
             ORDER BY u.nombre_completo, u.id
             LIMIT 100""",
        params,
    )

    users = []
    for row in rows:
        request_status = "none"  # sin solicitud, o una rechazada (se puede volver a mandar)
        if row["estado"] == "pending":
            request_status = "sent" if row["solicitante_id"] == me else "received"
        users.append({**user_summary(row), "requestStatus": request_status})

    return ok("Usuarios obtenidos", users)
