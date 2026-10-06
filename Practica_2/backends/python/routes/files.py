import re
from flask import Blueprint, request, jsonify, g
from db import call_sp
from utils.auth_middleware import auth_required, err
from utils.serialize import file_to_dict, text

files_bp = Blueprint("files", __name__, url_prefix="/api/files")

FILE_TYPES = {"image", "text", "other"}

@files_bp.get("")
@auth_required
def list_files():
    rows = call_sp("sp_listar_archivos", g.user_id)
    return jsonify([file_to_dict(f) for f in rows])

# JSON { name, type, url }: el archivo ya fue subido por Lambda / Azure Functions
# y solo se registra su URL para que aparezca en el listado del usuario.
@files_bp.post("")
@auth_required
def register_file():
    data = request.get_json(silent=True) or {}
    name = text(data.get("name"))
    url = text(data.get("url"))
    category = text(data.get("type")) or "other"
    if not name or not url:
        return err("Se requieren los campos name y url", 400)
    if not re.match(r"^https?://", url, re.IGNORECASE):
        return err("url debe ser http(s)", 400)
    if category not in FILE_TYPES:
        return err("type debe ser image, text u other", 400)

    rows = call_sp("sp_registrar_archivo", g.user_id, name, category, url)
    return jsonify(file_to_dict(rows[0])), 201

@files_bp.get("/<int:file_id>")
@auth_required
def get_file(file_id):
    rows = call_sp("sp_obtener_archivo", file_id, g.user_id)
    if not rows:
        return err("Archivo no encontrado", 404)
    return jsonify(file_to_dict(rows[0]))
