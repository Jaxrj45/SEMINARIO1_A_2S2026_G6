import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    SERVER_NAME_TAG = "python"
    JWT_SECRET = os.getenv("JWT_SECRET", "dev-secret-cambiar")
    JWT_HOURS = int(os.getenv("JWT_HOURS", "8"))
    
    # AWS S3
    S3_BUCKET = os.getenv("S3_BUCKET")
    S3_REGION = os.getenv("AWS_REGION", "us-east-1")
    
    # Base de Datos
    SQLALCHEMY_DATABASE_URI = os.getenv("DATABASE_URL", "sqlite:///dev.db")
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    MAX_CONTENT_LENGTH = 10 * 1024 * 1024  # 10 MB