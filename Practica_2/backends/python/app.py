import os
from flask import Flask
from config import Config
from extensions import cors
from utils.auth_middleware import err

# Importación de Blueprints
from routes.health import health_bp
from routes.auth import auth_bp
from routes.tasks import tasks_bp
from routes.files import files_bp

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    # Inicialización de extensiones
    cors.init_app(app)

    # Registro de Blueprints
    app.register_blueprint(health_bp)
    app.register_blueprint(auth_bp)
    app.register_blueprint(tasks_bp)
    app.register_blueprint(files_bp)

    # Manejo global de errores
    @app.errorhandler(413)
    def too_large(_):
        return err("Archivo demasiado grande (máx 10 MB)", 413)

    @app.errorhandler(404)
    def not_found(_):
        return err("Endpoint no encontrado", 404)

    return app

app = create_app()

if __name__ == "__main__":
    port = int(os.getenv("PORT", "5000"))
    app.run(host="0.0.0.0", port=port, debug=False)
