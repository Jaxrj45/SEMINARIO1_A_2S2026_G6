"""Subida de archivos al almacenamiento público del proveedor donde corre el servidor:
    STORAGE_PROVIDER=aws   -> bucket S3 (boto3), usado en la EC2
    STORAGE_PROVIDER=azure -> contenedor de Blob Storage, usado en la VM de Azure
Si no hay bucket/contenedor configurado se simula la URL (igual que backends/node)."""

import os
import uuid
from config import Config

_s3_client = None
_container_client = None


def _upload_to_s3(file, key):
    global _s3_client
    if not Config.S3_BUCKET:  # Modo simulación
        return f"http://simulated-bucket/{key}"

    import boto3
    if _s3_client is None:
        _s3_client = boto3.client("s3", region_name=Config.S3_REGION)
    _s3_client.upload_fileobj(
        file.stream,
        Config.S3_BUCKET,
        key,
        ExtraArgs={"ContentType": file.mimetype or "application/octet-stream"},
    )
    return f"https://{Config.S3_BUCKET}.s3.{Config.S3_REGION}.amazonaws.com/{key}"


def _upload_to_blob(file, key):
    global _container_client
    if not Config.AZURE_STORAGE_CONNECTION_STRING or not Config.AZURE_STORAGE_CONTAINER:
        return f"http://simulated-bucket/{key}"  # Modo simulación

    from azure.storage.blob import BlobServiceClient, ContentSettings
    if _container_client is None:
        _container_client = BlobServiceClient.from_connection_string(
            Config.AZURE_STORAGE_CONNECTION_STRING
        ).get_container_client(Config.AZURE_STORAGE_CONTAINER)
    blob = _container_client.get_blob_client(key)
    blob.upload_blob(
        file.stream,
        overwrite=True,
        content_settings=ContentSettings(
            content_type=file.mimetype or "application/octet-stream"
        ),
    )
    return blob.url


def upload_file(file, folder):
    """Sube el archivo y devuelve la URL pública. Key: <folder>/<uuid hex><ext>"""
    ext = os.path.splitext(file.filename or "")[1]
    key = f"{folder}/{uuid.uuid4().hex}{ext}"
    if Config.STORAGE_PROVIDER == "azure":
        return _upload_to_blob(file, key)
    return _upload_to_s3(file, key)
