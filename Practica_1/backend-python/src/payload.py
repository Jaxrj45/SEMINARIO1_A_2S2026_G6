from flask import request


def get_payload():
    content_type = request.content_type or ""

    if content_type.startswith("multipart/form-data"):
        data = request.form.to_dict()
        return data if (data or request.files) else None

    return request.get_json(silent=True)


def trim_or_none(value):
    if value is None:
        return None
    texto = str(value).strip()
    return texto or None
