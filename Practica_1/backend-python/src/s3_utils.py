import os
import uuid
import boto3

ALLOWED_EXTENSIONS = {"jpg", "jpeg", "png", "webp"}


def _get_s3_client():
  
    return boto3.client("s3", region_name=os.environ.get("AWS_REGION", "us-east-1"))


def allowed_file(filename):
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS


def upload_profile_photo(file_storage):
    
    ext = file_storage.filename.rsplit(".", 1)[1].lower()
    key = f"Fotos_Perfil/{uuid.uuid4().hex}.{ext}"

    bucket = os.environ.get("S3_BUCKET_NAME")
    s3 = _get_s3_client()

    s3.upload_fileobj(
        file_storage,
        bucket,
        key,
        ExtraArgs={"ContentType": file_storage.mimetype},
    )

    return key


def build_image_url(key):

    if not key:
        return None

    bucket = os.environ.get("S3_BUCKET_NAME")
    region = os.environ.get("AWS_REGION", "us-east-1")

    return f"https://{bucket}.s3.{region}.amazonaws.com/{key}"