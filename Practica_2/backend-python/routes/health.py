from flask import Blueprint, jsonify
from config import Config

health_bp = Blueprint("health", __name__)

@health_bp.get("/health")
def health():
    return jsonify({"status": "ok", "server": Config.SERVER_NAME_TAG})