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
