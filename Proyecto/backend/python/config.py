import os
import sys
from dotenv import load_dotenv

load_dotenv()


def _required(name):
    """Si falta una variable obligatoria el servidor no arranca, asi el error se ve de una vez."""
    value = os.getenv(name)
    if not value:
        print(f"Falta la variable de entorno {name} en el .env", file=sys.stderr)
        sys.exit(1)
    return value


def _without_trailing_slash(value):
    return (value or "").rstrip("/")


class Config:
    PORT = int(os.getenv("PORT", "5000"))

    DB_HOST = _required("DB_HOST")
    DB_PORT = int(os.getenv("DB_PORT", "3306"))
    DB_NAME = _required("DB_NAME")
    DB_USER = _required("DB_USER")
    DB_PASSWORD = os.getenv("DB_PASSWORD", "")

    JWT_SECRET = _required("JWT_SECRET")
    JWT_HOURS = int(os.getenv("JWT_HOURS", "8"))

    # Sin llaves: en la EC2 las credenciales salen del rol Semi-EC2-AppRole
    AWS_REGION = os.getenv("AWS_REGION", "us-east-1")

    COGNITO_USER_POOL_ID = os.getenv("COGNITO_USER_POOL_ID", "")
    COGNITO_CLIENT_ID = os.getenv("COGNITO_CLIENT_ID", "")

    UPLOAD_API = _without_trailing_slash(os.getenv("UPLOAD_API"))
    FACE_API_KEY = os.getenv("FACE_API_KEY", "")

    S3_BUCKET_URL = _without_trailing_slash(os.getenv("S3_BUCKET_URL"))
