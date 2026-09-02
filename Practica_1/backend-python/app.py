# CloudCinema - Backend Python/Flask
# Responsable: Integrante C

import os

from dotenv import load_dotenv
from flask import Flask, jsonify
from flask_cors import CORS

from src.json_provider import CloudCinemaJSONProvider
from src.routes.auth import auth_bp
from src.routes.movies import movies_bp
from src.routes.playlist import playlist_bp
from src.routes.profile import profile_bp
from src.routes.uploads import uploads_bp

load_dotenv()

app = Flask(__name__)
app.json = CloudCinemaJSONProvider(app)

raw_origins = os.environ.get("CORS_ORIGIN", "*")
origins = [o.strip() for o in raw_origins.split(",")] if raw_origins != "*" else "*"
CORS(app, origins=origins, supports_credentials=True)

PORT = int(os.environ.get("PORT", 3000))
SERVER_NAME = os.environ.get("SERVER_NAME", "python")

app.register_blueprint(auth_bp, url_prefix="/auth")
app.register_blueprint(movies_bp)
app.register_blueprint(playlist_bp)
app.register_blueprint(profile_bp)
app.register_blueprint(uploads_bp)


@app.route("/health")
def health():
    return jsonify({"status": "ok", "server": SERVER_NAME}), 200


@app.errorhandler(404)
def not_found(_e):
    return jsonify({"error": "Endpoint no encontrado"}), 404

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=PORT)
