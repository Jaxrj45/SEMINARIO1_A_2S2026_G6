"""Prueba de humo de la API de carga de imágenes (API Gateway -> Lambda -> S3/Rekognition).

Configura las variables de entorno ANTES de ejecutar (la clave NO va en el código):

    PowerShell:
        $env:SEMI_API_URL="https://TU_ID.execute-api.us-east-1.amazonaws.com/prod"
        $env:SEMI_API_KEY="tu_api_key"
        python test_api.py

    Bash:
        export SEMI_API_URL="https://TU_ID.execute-api.us-east-1.amazonaws.com/prod"
        export SEMI_API_KEY="tu_api_key"
        python test_api.py

Necesita en la misma carpeta: foto.jpg (una foto real pequeña) y selfie2.jpg
(otra foto tuya) y que Fotos_Perfil/selfie1.jpg exista en el bucket.
"""
import base64
import json
import os
import urllib.error
import urllib.request

API = os.environ["SEMI_API_URL"]
API_KEY = os.environ["SEMI_API_KEY"]

# PNG real de 1x1 píxel
PNG_1x1 = (
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=="
)


def b64(path):
    with open(path, "rb") as f:
        return base64.b64encode(f.read()).decode()


def call(path, payload, key=None):
    headers = {"Content-Type": "application/json"}
    if key:
        headers["x-api-key"] = key
    req = urllib.request.Request(
        API + path, data=json.dumps(payload).encode(), headers=headers, method="POST"
    )
    try:
        with urllib.request.urlopen(req) as r:
            return r.status, r.read().decode()
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode()


print("1) upload/profile:", call("/upload/profile",
      {"fileName": "p.png", "contentType": "image/png", "imageBase64": PNG_1x1}))

print("2) upload/post:", call("/upload/post",
      {"fileName": "foto.jpg", "contentType": "image/jpeg", "imageBase64": b64("foto.jpg")}))

face = {"sourceBase64": b64("selfie2.jpg"), "targetKey": "Fotos_Perfil/selfie1.jpg"}
print("3) face/compare SIN clave (debe dar 403):", call("/face/compare", face))
print("4) face/compare CON clave:", call("/face/compare", face, API_KEY))
