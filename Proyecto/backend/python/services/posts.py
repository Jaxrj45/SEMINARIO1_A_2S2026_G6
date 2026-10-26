from db import query
from utils.serialize import post_to_json

# Publicaciones que puede ver un usuario: las suyas y las de sus amigos.
# Espera la publicacion como p y recibe (me, me, me).
VISIBLE_TO = """
  (p.usuario_id = %s OR EXISTS (
     SELECT 1 FROM amistades a
      WHERE a.usuario_menor = LEAST(p.usuario_id, %s)
        AND a.usuario_mayor = GREATEST(p.usuario_id, %s)
        AND a.estado = 'accepted'))"""

POST_SELECT = """
  SELECT p.id, p.descripcion, p.imagen_key, p.creado_en,
         u.id AS u_id, u.username AS u_username, u.nombre_completo AS u_nombre_completo, u.foto_key AS u_foto_key,
         (SELECT COUNT(*) FROM comentarios c WHERE c.publicacion_id = p.id) AS comment_count
    FROM publicaciones p
    JOIN usuarios u ON u.id = p.usuario_id"""


def _labels_by_post(post_ids):
    """Etiquetas de varias publicaciones en una sola consulta, en orden alfabetico."""
    labels = {post_id: [] for post_id in post_ids}
    if not post_ids:
        return labels

    rows = query(
        """SELECT pe.publicacion_id, e.nombre
             FROM publicacion_etiquetas pe
             JOIN etiquetas e ON e.id = pe.etiqueta_id
            WHERE pe.publicacion_id IN %s
            ORDER BY e.nombre""",
        (post_ids,),
    )
    for row in rows:
        labels[row["publicacion_id"]].append(row["nombre"])
    return labels


def _with_labels(rows):
    labels = _labels_by_post([row["id"] for row in rows])
    return [post_to_json(row, labels[row["id"]]) for row in rows]


def find_feed(me, tag):
    """Feed: mis publicaciones y las de mis amigos, de la mas nueva a la mas vieja.
    Con tag solo las que tienen esa etiqueta (sin tag es el filtro "Todos")."""
    params = [me, me, me]
    tag_filter = ""
    if tag:
        tag_filter = """AND EXISTS (
          SELECT 1 FROM publicacion_etiquetas pe
            JOIN etiquetas e ON e.id = pe.etiqueta_id
           WHERE pe.publicacion_id = p.id AND e.nombre = %s)"""
        params.append(tag)

    rows = query(
        f"{POST_SELECT} WHERE {VISIBLE_TO} {tag_filter} ORDER BY p.creado_en DESC, p.id DESC",
        params,
    )
    return _with_labels(rows)


def find_post_by_id(post_id):
    posts = _with_labels(query(f"{POST_SELECT} WHERE p.id = %s", (post_id,)))
    return posts[0] if posts else None
