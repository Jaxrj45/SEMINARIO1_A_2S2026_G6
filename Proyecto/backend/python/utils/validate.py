import re

from utils.http import ApiError

USERNAME_RE = re.compile(r"[a-zA-Z0-9_.-]{3,50}")
EMAIL_RE = re.compile(r"[^\s@]+@[^\s@]+\.[^\s@]+")
DPI_RE = re.compile(r"[0-9]{13}")
MIN_PASSWORD = 8


def throw_if_invalid(fields):
    """Si hay campos con error corta la ruta con 400 VALIDATION_ERROR."""
    if fields:
        raise ApiError(400, "VALIDATION_ERROR", "Datos inválidos", fields)


def like_pattern(value):
    """Texto para LIKE '%...%' sin que % y _ del usuario funcionen como comodines."""
    escaped = value.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_")
    return f"%{escaped}%"


def clean_base64(value):
    """Quita el "data:image/jpeg;base64," si el frontend lo manda."""
    return re.sub(r"^data:image/[a-zA-Z+]+;base64,", "", value)
