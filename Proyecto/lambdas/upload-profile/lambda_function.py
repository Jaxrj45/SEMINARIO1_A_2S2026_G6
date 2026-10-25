"""semi-upload-profile
Recibe una imagen en base64, la valida y la guarda en Fotos_Perfil/ del bucket.

Variables de entorno:
    BUCKET_NAME  -> nombre del bucket de imágenes (semi1proyecto--g6)
"""
import base64
import json
import os
import uuid

import boto3

s3 = boto3.client("s3")

BUCKET = os.environ["BUCKET_NAME"]
FOLDER = "Fotos_Perfil"
MAX_BYTES = 4 * 1024 * 1024  # 4 MB ya decodificada

# tipo permitido -> (extensión, bytes iniciales reales del archivo)
ALLOWED = {
    "image/jpeg": ("jpg", b"\xff\xd8\xff"),
    "image/png": ("png", b"\x89PNG"),
}

HEADERS = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type,x-api-key,Authorization",
    "Access-Control-Allow-Methods": "POST,OPTIONS",
}


def respond(status, body):
    return {"statusCode": status, "headers": HEADERS, "body": json.dumps(body)}


def error(status, code, message):
    return respond(status, {"ok": False, "error": {"code": code, "message": message}})


def parse_payload(event):
    """Con API Gateway el JSON viene como texto en event['body'];
    desde la consola de Lambda llega directo en el evento."""
    if "body" in event:
        body = event["body"]
        return json.loads(body) if isinstance(body, str) else (body or {})
    return event


def lambda_handler(event, context):
    try:
        payload = parse_payload(event)
    except (json.JSONDecodeError, TypeError):
        return error(400, "INVALID_BODY", "El cuerpo no es un JSON válido")

    content_type = payload.get("contentType")
    image_b64 = payload.get("imageBase64")

    if content_type not in ALLOWED:
        return error(400, "INVALID_TYPE", "Solo se permiten image/jpeg e image/png")
    if not image_b64:
        return error(400, "INVALID_IMAGE", "Falta imageBase64")

    # Si el front manda un data URL ("data:image/png;base64,....") quitamos el prefijo
    if "," in image_b64:
        image_b64 = image_b64.split(",", 1)[1]

    try:
        image_bytes = base64.b64decode(image_b64, validate=True)
    except Exception:
        return error(400, "INVALID_IMAGE", "imageBase64 no es base64 válido")

    if len(image_bytes) > MAX_BYTES:
        return error(413, "TOO_LARGE", "La imagen supera los 4 MB")

    extension, magic = ALLOWED[content_type]
    if not image_bytes.startswith(magic):
        return error(400, "INVALID_IMAGE", "El contenido no coincide con el tipo de imagen")

    key = f"{FOLDER}/{uuid.uuid4().hex}.{extension}"

    try:
        s3.put_object(
            Bucket=BUCKET,
            Key=key,
            Body=image_bytes,
            ContentType=content_type,
        )
    except Exception as e:
        print(f"Error subiendo a S3: {e}")
        return error(500, "UPLOAD_FAILED", "No se pudo guardar la imagen")

    url = f"https://{BUCKET}.s3.amazonaws.com/{key}"
    return respond(200, {"ok": True, "data": {"key": key, "url": url}})
