from flask import Blueprint, request, jsonify, g
from extensions import db
from models.task import Task
from utils.auth_middleware import auth_required, err

tasks_bp = Blueprint("tasks", __name__, url_prefix="/api/tasks")

def get_own_task(task_id):
    return Task.query.filter_by(id=task_id, user_id=g.user_id).first()

@tasks_bp.get("")
@auth_required
def list_tasks():
    tasks = Task.query.filter_by(user_id=g.user_id).order_by(Task.created_at.desc()).all()
    return jsonify([t.to_dict() for t in tasks])

@tasks_bp.post("")
@auth_required
def create_task():
    data = request.get_json(silent=True) or {}
    if not (data.get("title") or "").strip():
        return err("title es obligatorio", 400)
    task = Task(user_id=g.user_id, title=data["title"].strip(), description=data.get("description", ""))
    db.session.add(task)
    db.session.commit()
    return jsonify(task.to_dict()), 201

@tasks_bp.put("/<int:task_id>")
@auth_required
def update_task(task_id):
    task = get_own_task(task_id)
    if not task:
        return err("Tarea no encontrada", 404)
    data = request.get_json(silent=True) or {}
    if "title" in data:
        if not data["title"].strip():
            return err("title no puede estar vacío", 400)
        task.title = data["title"].strip()
    if "description" in data:
        task.description = data["description"]
    db.session.commit()
    return jsonify(task.to_dict())

@tasks_bp.patch("/<int:task_id>/complete")
@auth_required
def complete_task(task_id):
    task = get_own_task(task_id)
    if not task:
        return err("Tarea no encontrada", 404)
    data = request.get_json(silent=True) or {}
    task.completed = bool(data.get("completed", not task.completed))
    db.session.commit()
    return jsonify(task.to_dict())

@tasks_bp.delete("/<int:task_id>")
@auth_required
def delete_task(task_id):
    task = get_own_task(task_id)
    if not task:
        return err("Tarea no encontrada", 404)
    db.session.delete(task)
    db.session.commit()
    return jsonify({"message": "Tarea eliminada"})