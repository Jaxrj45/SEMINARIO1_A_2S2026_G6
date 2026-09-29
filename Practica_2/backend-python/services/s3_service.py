import os
import uuid
from config import Config

def upload_to_s3(file, folder):
    """Sube al bucket público de archivos con boto3 y devuelve la URL del objeto."""
    ext = os.path.splitext(file.filename or "")[1]
    key = f"{folder}/{uuid.uuid4().hex}{ext}"
    
    if not Config.S3_BUCKET:  # Modo simulación
        return f"http://simulated-bucket/{key}"
        
    import boto3
    s3 = boto3.client("s3", region_name=Config.S3_REGION)
    s3.upload_fileobj(
        file.stream, 
        Config.S3_BUCKET, 
        key,
        ExtraArgs={"ContentType": file.mimetype or "application/octet-stream"}
    )
    return f"https://{Config.S3_BUCKET}.s3.{Config.S3_REGION}.amazonaws.com/{key}"