# CloudCinema - Backend Python / Flask
# Esta instancia y la de Node.js deben exponer los mismos endpoints
# para que el balanceador de carga sea transparente.

import os
from datetime import datetime, timezone

from flask import Flask, jsonify
from flask_cors import CORS
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
CORS(app)

PORT = int(os.environ.get("PORT", 3000))
SERVER_NAME = os.environ.get("SERVER_NAME", "python")


@app.route("/health")
def health():
    return jsonify(
        {
            "status": "ok",
            "server": SERVER_NAME,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }
    ), 200


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=PORT)
