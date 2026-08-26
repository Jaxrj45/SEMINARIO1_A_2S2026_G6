# Conexión a RDS y helper de S3

import os
import boto3
import mysql.connector

s3_client = boto3.client("s3", region_name=os.environ.get("AWS_REGION"))


def get_db_connection():
    return mysql.connector.connect(
        host=os.environ.get("DB_HOST"),
        user=os.environ.get("DB_USER"),
        password=os.environ.get("DB_PASSWORD"),
        database=os.environ.get("DB_NAME"),
    )
