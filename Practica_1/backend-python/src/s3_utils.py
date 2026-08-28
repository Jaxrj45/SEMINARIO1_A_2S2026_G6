import os
import uuid
import boto3

ALLOWED_EXTENSIONS = {"jpg", "jpeg", "png", "webp"}


def _get_s3_client():
    """
    No pasamos aws_access_key_id/secret explícitos aquí a propósito.
    boto3 los busca automáticamente en este orden:
      1. Variables de entorno (AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY)
         -> esto es lo que usamos ahora, en local, vía tu .env
      2. Archivo ~/.aws/credentials
      3. Rol IAM de la instancia EC2 (si corre en AWS)
    Gracias a esto, cuando despleguemos en EC2 con un rol IAM asignado
    (Fase 10), este código NO cambia: boto3 detecta automáticamente
    que ya no hay variables de entorno con keys y usa el rol de la
    instancia en su lugar.
    """
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
    """
    Convierte una key relativa (ej. "Fotos_Perfil/abc123.jpg") en la
    URL pública completa
    """
    if not key:
        return None

    bucket = os.environ.get("S3_BUCKET_NAME")
    region = os.environ.get("AWS_REGION", "us-east-1")

    return f"https://{bucket}.s3.{region}.amazonaws.com/{key}"