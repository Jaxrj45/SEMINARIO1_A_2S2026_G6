from botocore.exceptions import ClientError, NoCredentialsError
from flask import Blueprint, jsonify, request

from src.s3_utils import allowed_file, build_image_url, upload_profile_photo

uploads_bp = Blueprint("uploads", __name__, url_prefix="/uploads")


@uploads_bp.route("/profile-photo", methods=["POST"])
def upload_profile_photo_route():
    if "file" not in request.files:
        return jsonify({"error": "No se envio ningun archivo (campo 'file')"}), 400

    file = request.files["file"]

    if file.filename == "":
        return jsonify({"error": "Nombre de archivo vacio"}), 400

    if not allowed_file(file.filename):
        return jsonify({"error": "Formato no permitido. Usa jpg, jpeg, png o webp"}), 400

    try:
        key = upload_profile_photo(file)
    except NoCredentialsError:
        return jsonify({"error": "Credenciales de AWS no configuradas en el servidor"}), 500
    except ClientError as e:
        mensaje = e.response["Error"]["Message"]
        return jsonify({"error": f"Error al subir a S3: {mensaje}"}), 502

    return jsonify({"key": key, "url": build_image_url(key)}), 201
