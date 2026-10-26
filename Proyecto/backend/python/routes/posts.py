from flask import Blueprint, g, request

from db import transaction
from services.posts import find_feed, find_post_by_id
from utils.auth import require_auth
from utils.format import text
from utils.http import ApiError, get_body, ok
from utils.validate import throw_if_invalid

posts_bp = Blueprint("posts", __name__, url_prefix="/api/posts")
posts_bp.before_request(require_auth)

MAX_DESCRIPTION = 1000
MAX_LABEL = 100  # largo de etiquetas.nombre
MAX_LABELS = 50


def _clean_labels(value):
    """Etiquetas sin repetir y sin vacias. MySQL compara sin mayusculas, asi que Beach y beach son la misma."""
    seen = set()
    labels = []
    for item in value:
        label = text(item)
        if not label or label.lower() in seen:
            continue
        seen.add(label.lower())
        labels.append(label)
    return labels


@posts_bp.get("")
def list_posts():
    """?tag= filtra por etiqueta."""
    return ok("Publicaciones obtenidas", find_feed(g.user_id, text(request.args.get("tag"))))


@posts_bp.post("")
def create_post():
    """body: { "description": "...", "imageKey": "Fotos_Publicadas/...", "labels": ["Beach"] }
    El frontend ya subio la imagen con upload/post y reenvia la key y las etiquetas de Rekognition."""
    body = get_body()
    description = text(body.get("description")) or None
    image_key = text(body.get("imageKey"))
    raw_labels = body.get("labels")
    if raw_labels is None:
        raw_labels = []
    labels = _clean_labels(raw_labels) if isinstance(raw_labels, list) else []

    if not image_key.startswith("Fotos_Publicadas/"):
        raise ApiError(400, "VALIDATION_ERROR", "La imagen es obligatoria", {"imageKey": "Requerido"})

    fields = {}
    if description and len(description) > MAX_DESCRIPTION:
        fields["description"] = f"Máximo {MAX_DESCRIPTION} caracteres"
    if (
        not isinstance(raw_labels, list)
        or len(labels) > MAX_LABELS
        or any(len(label) > MAX_LABEL for label in labels)
    ):
        fields["labels"] = f"Debe ser una lista de hasta {MAX_LABELS} textos de {MAX_LABEL} caracteres como máximo"
    throw_if_invalid(fields)

    # La publicacion y sus etiquetas se guardan juntas o no se guarda nada
    with transaction() as cur:
        cur.execute(
            "INSERT INTO publicaciones (usuario_id, descripcion, imagen_key) VALUES (%s, %s, %s)",
            (g.user_id, description, image_key),
        )
        post_id = cur.lastrowid

        if labels:
            # IGNORE: las etiquetas que ya existen se dejan como estan
            cur.executemany("INSERT IGNORE INTO etiquetas (nombre) VALUES (%s)", [(label,) for label in labels])
            cur.execute(
                """INSERT INTO publicacion_etiquetas (publicacion_id, etiqueta_id)
                   SELECT %s, id FROM etiquetas WHERE nombre IN %s""",
                (post_id, labels),
            )

    return ok("Publicación creada", find_post_by_id(post_id), 201)
