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
    body = body if isinstance(body, dict) else {}
    data = body.get("data") if isinstance(body.get("data"), dict) else {}
    error = body.get("error") if isinstance(body.get("error"), dict) else {}
    # La Lambda responde { ok, data } o { ok: false, error: { code } }; tambien se acepta el formato del contrato
    succeeded = body.get("ok") is True or body.get("status") == "success"
    error_code = error.get("code") or data.get("code")

    if response.status_code == 422 or error_code == "NO_FACE_DETECTED":
        raise ApiError(422, "NO_FACE_DETECTED", "No se detectó un rostro en la imagen")
    if error_code == "INVALID_IMAGE":
        raise ApiError(400, "UNSUPPORTED_MEDIA_TYPE", "La foto debe ser JPG o PNG")
    if not response.ok or not succeeded:
        print("[face] /face/compare respondio", response.status_code, body)
        raise ApiError(502, "UPSTREAM_ERROR", "No se pudo comparar el rostro")

    return {"match": bool(data.get("match")), "similarity": float(data.get("similarity") or 0)}
