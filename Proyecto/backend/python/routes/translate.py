from flask import Blueprint

from services.translate import translate_text
from utils.auth import require_auth
from utils.format import text
from utils.http import ApiError, get_body, ok
from utils.validate import throw_if_invalid

translate_bp = Blueprint("translate", __name__, url_prefix="/api/translate")
translate_bp.before_request(require_auth)

LANGUAGES = ("es", "en", "fr", "pt")
# Translate acepta hasta 10,000 bytes por peticion; las descripciones y comentarios llegan a 1000
MAX_TEXT = 5000


@translate_bp.post("")
def translate():
    """body: { "text": "Hola mundo", "targetLang": "en" }"""
    body = get_body()
    content = text(body.get("text"))
    target_lang = body.get("targetLang")

    fields = {}
    if not content or len(content) > MAX_TEXT:
        fields["text"] = f"Es obligatorio (máximo {MAX_TEXT} caracteres)"
    if target_lang not in LANGUAGES:
        fields["targetLang"] = "Debe ser es, en, fr o pt"
    if "targetLang" in fields and "text" not in fields:
        raise ApiError(400, "VALIDATION_ERROR", "Idioma no soportado", fields)
    throw_if_invalid(fields)

    result = translate_text(content, target_lang)
    return ok("Texto traducido", {**result, "targetLang": target_lang})
