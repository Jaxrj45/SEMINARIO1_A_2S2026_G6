"""Forma JSON de las filas que devuelven los stored procedures
(idéntica a backends/node/src/utils/serialize.ts)."""


def user_to_dict(row):
    return {
        "id": row["id"],
        "username": row["username"],
        "email": row["email"],
        "profileImageUrl": row["profile_image_url"],
    }


def task_to_dict(row):
    return {
        "id": row["id"],
        "title": row["title"],
        "description": row["description"],
        "completed": row["completed"],
        "createdAt": row["created_at"],
    }


def file_to_dict(row):
    return {
        "id": row["id"],
        "name": row["name"],
        "type": row["type"],
        "url": row["url"],
        "createdAt": row["created_at"],
    }


def text(value):
    return value.strip() if isinstance(value, str) else ""
