import os
import uuid

import boto3

ALLOWED_EXTENSIONS = {"jpg", "jpeg", "png", "webp"}


def _get_s3_client():
    return boto3.client("s3", region_name=os.environ.get("AWS_REGION", "us-east-1"))


def _bucket():
    return os.environ.get("S3_BUCKET_IMAGES")


def allowed_file(filename):
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS


def upload_profile_photo(file_storage):
    ext = file_storage.filename.rsplit(".", 1)[1].lower()
    folder = os.environ.get("S3_FOLDER_PROFILE", "Fotos_Perfil")
    key = f"{folder}/{uuid.uuid4().hex}.{ext}"

    _get_s3_client().upload_fileobj(
        file_storage,
        _bucket(),
        key,
        ExtraArgs={"ContentType": file_storage.mimetype},
    )

    return key


def build_image_url(key):
    if not key:
        return None

    region = os.environ.get("AWS_REGION", "us-east-1")

    return f"https://{_bucket()}.s3.{region}.amazonaws.com/{key}"
