import requests

from config import Config
from utils.http import ApiError


def compare_face(source_base64, target_key):
    """Llama a la Lambda face-compare por API Gateway (POST {UPLOAD_API}/face/compare)."""
    if not Config.UPLOAD_API or not Config.FACE_API_KEY:
        raise ApiError(502, "UPSTREAM_ERROR", "El login facial no está configurado en el servidor")

    try:
        response = requests.post(
            f"{Config.UPLOAD_API}/face/compare",
            json={"sourceBase64": source_base64, "targetKey": target_key},
            headers={"x-api-key": Config.FACE_API_KEY},
            timeout=20,
        )
    except requests.RequestException as e:
        print("[face] no hubo respuesta de /face/compare:", e)
        raise ApiError(502, "UPSTREAM_ERROR", "No se pudo comparar el rostro")

    try:
        body = response.json()
    except ValueError:
        body = None
    data = body.get("data") if isinstance(body, dict) else None
    data = data if isinstance(data, dict) else {}

    if response.status_code == 422 or data.get("code") == "NO_FACE_DETECTED":
        raise ApiError(422, "NO_FACE_DETECTED", "No se detectó un rostro en la imagen")
    if not response.ok or not isinstance(body, dict) or body.get("status") != "success":
        print("[face] /face/compare respondio", response.status_code, body)
        raise ApiError(502, "UPSTREAM_ERROR", "No se pudo comparar el rostro")

    return {"match": bool(data.get("match")), "similarity": float(data.get("similarity") or 0)}
