"""semi-face-compare
Compara la foto de la cámara (bytes) contra la foto de perfil guardada en S3
usando Amazon Rekognition (CompareFaces). Solo la llama el backend (x-api-key).

Variables de entorno:
    BUCKET_NAME           -> nombre del bucket de imágenes (semi1proyecto--g6)
    SIMILARITY_THRESHOLD  -> umbral de similitud en % (por defecto 90)
"""
import base64
import json
import os

import boto3
from botocore.exceptions import ClientError

rekognition = boto3.client("rekognition")

BUCKET = os.environ["BUCKET_NAME"]
THRESHOLD = float(os.environ.get("SIMILARITY_THRESHOLD", "90"))
MAX_BYTES = 4 * 1024 * 1024
ALLOWED_PREFIX = "Fotos_Perfil/"
MAGIC = (b"\xff\xd8\xff", b"\x89PNG")  # JPEG y PNG

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
    if "body" in event:
        body = event["body"]
        return json.loads(body) if isinstance(body, str) else (body or {})
    return event


def lambda_handler(event, context):
    try:
        payload = parse_payload(event)
    except (json.JSONDecodeError, TypeError):
        return error(400, "INVALID_BODY", "El cuerpo no es un JSON válido")

    source_b64 = payload.get("sourceBase64")
    target_key = payload.get("targetKey")

    if not source_b64:
        return error(400, "INVALID_IMAGE", "Falta sourceBase64")
    if (
        not isinstance(target_key, str)
        or not target_key.startswith(ALLOWED_PREFIX)
        or ".." in target_key
    ):
        return error(400, "INVALID_TARGET", "targetKey debe estar dentro de Fotos_Perfil/")

    if "," in source_b64:
        source_b64 = source_b64.split(",", 1)[1]

    try:
        source_bytes = base64.b64decode(source_b64, validate=True)
    except Exception:
        return error(400, "INVALID_IMAGE", "sourceBase64 no es base64 válido")

    if len(source_bytes) > MAX_BYTES:
        return error(413, "TOO_LARGE", "La imagen supera los 4 MB")
    if not source_bytes.startswith(MAGIC):
        return error(400, "INVALID_IMAGE", "La imagen debe ser JPEG o PNG")

    try:
        result = rekognition.compare_faces(
            SourceImage={"Bytes": source_bytes},
            TargetImage={"S3Object": {"Bucket": BUCKET, "Name": target_key}},
            SimilarityThreshold=THRESHOLD,
        )
    except ClientError as e:
        code = e.response["Error"]["Code"]
        print(f"Rekognition CompareFaces falló: {code}")
        if code == "InvalidParameterException":
            return error(422, "NO_FACE_DETECTED", "No se detectó un rostro en una de las imágenes")
        if code in ("InvalidS3ObjectException", "ResourceNotFoundException"):
            return error(404, "TARGET_NOT_FOUND", "No se encontró la foto de perfil")
        return error(500, "COMPARE_FAILED", "No se pudo comparar los rostros")
    except Exception as e:
        print(f"Error inesperado: {e}")
        return error(500, "COMPARE_FAILED", "No se pudo comparar los rostros")

    matches = result.get("FaceMatches", [])
    if matches:
        similarity = round(max(m["Similarity"] for m in matches), 1)
        return respond(200, {"ok": True, "data": {"match": True, "similarity": similarity}})

    return respond(200, {"ok": True, "data": {"match": False, "similarity": 0}})
