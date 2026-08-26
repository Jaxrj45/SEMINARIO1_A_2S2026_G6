import os


def build_image_url(key):
    """
    Convierte una key relativa de S3 (ej. "Fotos_Peliculas/dune.jpg")
    en la URL pública completa del objeto.
    """
    if not key:
        return None

    bucket = os.environ.get("S3_BUCKET_NAME")
    region = os.environ.get("AWS_REGION")

    return f"https://{bucket}.s3.{region}.amazonaws.com/{key}"  