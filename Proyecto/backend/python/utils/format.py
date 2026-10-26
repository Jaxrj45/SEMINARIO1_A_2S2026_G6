from datetime import datetime
from urllib.parse import quote

from config import Config


def to_iso(value):
    """Fecha en el formato del contrato: "2026-10-24T15:30:00Z" (UTC, con Z y sin milisegundos)."""
    if value is None:
        return None
    if not isinstance(value, datetime):
        value = datetime.fromisoformat(str(value).replace(" ", "T").rstrip("Z"))
    return value.replace(tzinfo=None).strftime("%Y-%m-%dT%H:%M:%SZ")


def s3_url(key):
    """URL publica de una imagen a partir de su key en el bucket."""
    if not key:
        return None
    # Mismos caracteres que deja sin codificar encodeURIComponent en Node
    path = "/".join(quote(part, safe="!*'()") for part in key.split("/"))
    return f"{Config.S3_BUCKET_URL}/{path}"


def text(value):
    """Texto del body sin espacios al inicio y al final ('' si no es texto)."""
    return value.strip() if isinstance(value, str) else ""


def to_id(value):
    """Id numerico de la URL o del body (None si no es un entero positivo)."""
    if value is None or isinstance(value, bool):
        return None
    try:
        number = float(str(value).strip())
    except ValueError:
        return None
    return int(number) if number.is_integer() and number > 0 else None
