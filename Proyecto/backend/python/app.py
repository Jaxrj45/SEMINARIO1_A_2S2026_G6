import sys

from flask import Flask
from flask_cors import CORS
from werkzeug.exceptions import HTTPException

from config import Config
from db import check_connection
from routes.auth import auth_bp
from routes.chat import chat_bp
from routes.comments import comments_bp
from routes.friends import friends_bp
from routes.health import health_bp
from routes.posts import posts_bp
from routes.tags import tags_bp
from routes.translate import translate_bp
from routes.users import users_bp
from services.chat_socket import init_chat
from utils.http import ApiError, fail


def register_error_handlers(app):
    @app.errorhandler(ApiError)
    def api_error(e):
        return fail(e.http_status, e.code, e.message, e.fields)

    # Express responde 404 tambien cuando el metodo no existe, asi que aqui igual
    @app.errorhandler(404)
    @app.errorhandler(405)
    def not_found(_):
        return fail(404, "NOT_FOUND", "La ruta no existe")

    @app.errorhandler(413)
    def too_large(_):
        return fail(413, "IMAGE_TOO_LARGE", "La petición es demasiado grande")

    @app.errorhandler(Exception)
    def unexpected(e):
        if isinstance(e, HTTPException):
            return fail(e.code or 500, "INTERNAL_ERROR", "Ocurrió un error en el servidor")
        # Nunca se manda el detalle (SQL, stack) al cliente, solo queda en el log
        app.logger.exception("Error no controlado")
        return fail(500, "INTERNAL_ERROR", "Ocurrió un error en el servidor")


def create_app():
    app = Flask(__name__)

    # /api/friends y /api/friends/ responden igual, como en Express
    app.url_map.strict_slashes = False
    # Mismo JSON que Node: llaves en el orden escrito y tildes sin escapar
    app.json.sort_keys = False
    app.json.ensure_ascii = False
    # El login facial manda la foto en base64 (hasta 1.5 MB, que en base64 son unos 2 MB)
    app.config["MAX_CONTENT_LENGTH"] = 3 * 1024 * 1024

    CORS(app)

    app.register_blueprint(health_bp)
    app.register_blueprint(auth_bp)
    app.register_blueprint(users_bp)
    app.register_blueprint(friends_bp)
    app.register_blueprint(comments_bp)

    app.register_blueprint(posts_bp)
    app.register_blueprint(tags_bp)
    app.register_blueprint(translate_bp)
    app.register_blueprint(chat_bp)
    # El chat (WS /api/ws) usa el mismo puerto que la API
    init_chat(app)

    register_error_handlers(app)
    return app


# Antes de abrir el puerto se revisa que la base responda
try:
    check_connection()
except Exception as e:
    print(f"No se pudo conectar a la base de datos: {e}", file=sys.stderr)
    sys.exit(1)

app = create_app()

if __name__ == "__main__":
    print(f"[python] escuchando en el puerto {Config.PORT}")
    app.run(host="0.0.0.0", port=Config.PORT, debug=False)
