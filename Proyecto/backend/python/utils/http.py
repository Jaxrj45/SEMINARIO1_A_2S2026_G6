"""Formato de respuesta del contrato: { status, message, data }"""

from flask import jsonify, request


def ok(message, data=None, http_status=200):
    return jsonify({"status": "success", "message": message, "data": data}), http_status


def fail(http_status, code, message, fields=None):
    data = {"code": code}
    if fields:
        data["fields"] = fields
    return jsonify({"status": "error", "message": message, "data": data}), http_status


class ApiError(Exception):
    """Para cortar una ruta desde cualquier parte con: raise ApiError(404, "NOT_FOUND", "...")
    El manejador de errores de app.py lo convierte en la respuesta."""

    def __init__(self, http_status, code, message, fields=None):
        super().__init__(message)
        self.http_status = http_status
        self.code = code
        self.message = message
        self.fields = fields


def get_body():
    """Body JSON como diccionario ({} si no viene). Si el JSON esta mal escrito responde 400."""
    data = request.get_json(silent=True)
    if data is None and request.is_json and request.get_data(cache=True):
        raise ApiError(400, "VALIDATION_ERROR", "El JSON de la petición no es válido")
    return data if isinstance(data, dict) else {}
