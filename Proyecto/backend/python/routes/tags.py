from flask import Blueprint, g, request

from db import query
from services.posts import VISIBLE_TO
from utils.auth import require_auth
from utils.format import text
from utils.http import ok
from utils.validate import like_pattern

tags_bp = Blueprint("tags", __name__, url_prefix="/api/tags")
tags_bp.before_request(require_auth)


@tags_bp.get("")
def list_tags():
    """Etiquetas de las publicaciones de mi feed, en orden alfabetico. El filtro "Todos" lo agrega el frontend."""
    me = g.user_id
    search = text(request.args.get("q"))

    params = [me, me, me]
    search_filter = ""
    if search:
        search_filter = "AND e.nombre LIKE %s"
        params.append(like_pattern(search))

    rows = query(
        f"""SELECT e.nombre, COUNT(*) AS total
              FROM publicacion_etiquetas pe
              JOIN etiquetas e ON e.id = pe.etiqueta_id
              JOIN publicaciones p ON p.id = pe.publicacion_id
             WHERE {VISIBLE_TO} {search_filter}
             GROUP BY e.id, e.nombre
             ORDER BY e.nombre""",
        params,
    )

    return ok("Etiquetas obtenidas", [{"name": row["nombre"], "count": int(row["total"])} for row in rows])
