from flask import Blueprint, request, jsonify
from botocore.exceptions import ClientError, NoCredentialsError

from src.s3_utils import upload_profile_photo, allowed_file, build_image_url

uploads_bp = Blueprint("uploads", __name__, url_prefix="/uploads")


@uploads_bp.route("/profile-photo", methods=["POST"])
def upload_profile_photo_route():
    if "file" not in request.files:
        return jsonify({"error": "No se envió ningún archivo (campo 'file')"}), 400

    file = request.files["file"]

    if file.filename == "":
        return jsonify({"error": "Nombre de archivo vacío"}), 400

    if not allowed_file(file.filename):
        return jsonify({"error": "Formato no permitido. Usa jpg, jpeg, png o webp"}), 400

    try:
        key = upload_profile_photo(file)
    except NoCredentialsError:
        return jsonify({"error": "Credenciales de AWS no configuradas en el servidor"}), 500
    except ClientError as e:
        return jsonify({"error": f"Error al subir a S3: {e.response['Error']['Message']}"}), 502

    return jsonify({
        "key": key,
        "url": build_image_url(key),
    }), 201