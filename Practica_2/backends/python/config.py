import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    SERVER_NAME_TAG = "python"
    JWT_SECRET = os.getenv("JWT_SECRET", "dev-secret-cambiar")
    JWT_HOURS = int(os.getenv("JWT_HOURS", "8"))

    # Base de Datos (Amazon RDS PostgreSQL)
    DB_HOST = os.getenv("DB_HOST")
    DB_PORT = int(os.getenv("DB_PORT", "5432"))
    DB_NAME = os.getenv("DB_NAME", "taskflow")
    DB_USER = os.getenv("DB_USER")
    DB_PASSWORD = os.getenv("DB_PASSWORD")
    DB_SSL = os.getenv("DB_SSL", "true").lower() == "true"

    # Almacenamiento: "aws" en la EC2, "azure" en la VM de Azure
    STORAGE_PROVIDER = os.getenv("STORAGE_PROVIDER", "aws").lower()

    # AWS S3
    S3_BUCKET = os.getenv("S3_BUCKET")
    S3_REGION = os.getenv("AWS_REGION", "us-east-1")

    # Azure Blob Storage
    AZURE_STORAGE_CONNECTION_STRING = os.getenv("AZURE_STORAGE_CONNECTION_STRING")
    AZURE_STORAGE_CONTAINER = os.getenv("AZURE_STORAGE_CONTAINER")

    MAX_CONTENT_LENGTH = 10 * 1024 * 1024  # 10 MB
