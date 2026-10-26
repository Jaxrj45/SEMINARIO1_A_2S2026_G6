"""Filas de MySQL (nombres de la base) -> JSON del contrato (nombres en ingles).
Tiene que dar exactamente lo mismo que backend/node/src/utils/serialize.ts."""

from utils.format import s3_url, to_iso


def user_to_json(u):
    """Perfil completo, solo para el propio usuario."""
    return {
        "id": u["id"],
        "username": u["username"],
        "fullName": u["nombre_completo"],
        "email": u["email"],
        "dpi": u["dpi"],
        "photoUrl": s3_url(u["foto_key"]),
        "createdAt": to_iso(u["creado_en"]),
    }


def user_summary(row, prefix=""):
    """Version corta para mostrar a otros usuarios (sin correo ni DPI).
    prefix sirve cuando la consulta trae dos usuarios, ej. s_id y d_id."""
    return {
        "id": row[f"{prefix}id"],
        "username": row[f"{prefix}username"],
        "fullName": row[f"{prefix}nombre_completo"],
        "photoUrl": s3_url(row[f"{prefix}foto_key"]),
    }


def request_to_json(row):
    return {
        "id": row["id"],
        "fromUser": user_summary(row, "s_"),
        "toUser": user_summary(row, "d_"),
        "status": row["estado"],
        "createdAt": to_iso(row["creado_en"]),
    }


def comment_to_json(row):
    return {
        "id": row["id"],
        "postId": row["publicacion_id"],
        "author": user_summary(row, "u_"),
        "text": row["texto"],
        "createdAt": to_iso(row["creado_en"]),
    }
