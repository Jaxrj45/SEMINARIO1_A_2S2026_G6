from flask import Blueprint, request, jsonify, g
from extensions import db
from models.file import FileRecord
from services.s3_service import upload_to_s3
from utils.auth_middleware import auth_required, err, file_category

files_bp = Blueprint("files", __name__, url_prefix="/api/files")

@files_bp.get("")
@auth_required
def list_files():
    files = FileRecord.query.filter_by(user_id=g.user_id).order_by(FileRecord.created_at.desc()).all()
    return jsonify([f.to_dict() for f in files])

@files_bp.post("")
@auth_required
def upload_file():
    file = request.files.get("file")
    if not file or not file.filename:
        return err("Se requiere el campo 'file'", 400)
    category = file_category(file.mimetype or "")
    url = upload_to_s3(file, f"files/{g.user_id}")
    record = FileRecord(user_id=g.user_id, name=file.filename, type=category, url=url)
    db.session.add(record)
    db.session.commit()
    return jsonify(record.to_dict()), 201

@files_bp.get("/<int:file_id>")
@auth_required
def get_file(file_id):
    record = FileRecord.query.filter_by(id=file_id, user_id=g.user_id).first()
    if not record:
        return err("Archivo no encontrado", 404)
    return jsonify(record.to_dict())