# CloudCinema - Backend Python/Flask
# Responsable: Integrante C (Backend Python Lead / DB Specialist)

import os
from flask import Flask, jsonify
from flask_cors import CORS
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
CORS(app)

PORT = int(os.environ.get("PORT", 3000))


@app.route("/health")
def health():
    return jsonify({"status": "ok", "server": "python"})


# TODO (Integrante C): mover cada endpoint a src/routes_*.py conforme se implemente
# app.register_blueprint(auth_bp)
# app.register_blueprint(movies_bp)
# app.register_blueprint(playlist_bp)
# app.register_blueprint(profile_bp)

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=PORT)
