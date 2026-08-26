# CloudCinema - Backend Python/Flask
# Responsable: Integrante C

import os
import re
import hashlib
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv

from src.db import get_db_connection
from src.routes.auth import auth_bp

load_dotenv()

app = Flask(__name__)
CORS(app)

PORT = int(os.environ.get("PORT", 5000))


# Registro del blueprint de autenticación
app.register_blueprint(auth_bp, url_prefix="/auth")


# Regex simple para validar formato de correo antes de tocar la BD
EMAIL_REGEX = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


@app.route("/health")
def health():
    return jsonify({"status": "ok", "server": "python"})




if __name__ == "__main__":
    app.run(host="0.0.0.0", port=PORT, debug=True)