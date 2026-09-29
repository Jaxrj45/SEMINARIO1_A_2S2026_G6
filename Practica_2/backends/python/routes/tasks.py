from flask import Blueprint, request, jsonify, g
from db import call_sp
from utils.auth_middleware import auth_required, err
from utils.serialize import task_to_dict, text

tasks_bp = Blueprint("tasks", __name__, url_prefix="/api/tasks")

@tasks_bp.get("")
@auth_required
def list_tasks():
    rows = call_sp("sp_listar_tareas", g.user_id)
    return jsonify([task_to_dict(t) for t in rows])

@tasks_bp.post("")
@auth_required
def create_task():
    data = request.get_json(silent=True) or {}
    title = text(data.get("title"))
    if not title:
        return err("title es obligatorio", 400)
    rows = call_sp("sp_crear_tarea", g.user_id, title, data.get("description", ""))
    return jsonify(task_to_dict(rows[0])), 201

@tasks_bp.put("/<int:task_id>")
@auth_required
def update_task(task_id):
    data = request.get_json(silent=True) or {}
    title = None
    if "title" in data:
        title = text(data["title"])
        if not title:
            return err("title no puede estar vacío", 400)
    set_description = "description" in data
    rows = call_sp(
        "sp_actualizar_tarea",
        task_id,
        g.user_id,
        title,
        data.get("description") if set_description else None,
        set_description,
    )
    if not rows:
        return err("Tarea no encontrada", 404)
    return jsonify(task_to_dict(rows[0]))

@tasks_bp.patch("/<int:task_id>/complete")
@auth_required
def complete_task(task_id):
    data = request.get_json(silent=True) or {}
    # Sin "completed" el SP recibe NULL y alterna el estado
    completed = bool(data["completed"]) if "completed" in data else None
    rows = call_sp("sp_marcar_tarea", task_id, g.user_id, completed)
    if not rows:
        return err("Tarea no encontrada", 404)
    return jsonify(task_to_dict(rows[0]))

@tasks_bp.delete("/<int:task_id>")
@auth_required
def delete_task(task_id):
    rows = call_sp("sp_eliminar_tarea", task_id, g.user_id)
    if not rows[0]["deleted"]:
        return err("Tarea no encontrada", 404)
    return jsonify({"message": "Tarea eliminada"})
