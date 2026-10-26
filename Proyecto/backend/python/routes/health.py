from flask import Blueprint

from utils.http import ok

health_bp = Blueprint("health", __name__, url_prefix="/api/health")


@health_bp.get("")
def health():
    """Lo usa el Target Group del balanceador. server dice quien respondio."""
    return ok("OK", {"server": "python"})
