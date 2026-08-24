# Conexión a RDS y helper de S3
# Responsable: Integrante C (diseño de esquema y conexión)

import os
import boto3
import mysql.connector

s3_client = boto3.client("s3", region_name=os.environ.get("AWS_REGION"))


def get_db_connection():
    return mysql.connector.connect(
        host=os.environ.get("RDS_HOST"),
        user=os.environ.get("RDS_USER"),
        password=os.environ.get("RDS_PASSWORD"),
        database=os.environ.get("RDS_DATABASE"),
    )


# TODO (Integrante C): agregar aquí el schema.sql de referencia
# con las tablas: usuarios, peliculas, playlist
