"""Prueba de humo del contrato de la API. Sirve local, en la VM, en el LB y en EC2.
Uso: BASE_URL=http://host:puerto python test_api.py
"""

import os, uuid, sys, requests

BASE = os.getenv("BASE_URL", "http://127.0.0.1:5000").rstrip("/")
u = "user_" + uuid.uuid4().hex[:8]
ok = True


def check(name, cond, extra=""):
    global ok
    ok = ok and cond
    print(("[OK]   " if cond else "[FAIL] ") + name, extra)


r = requests.get(f"{BASE}/health")
check("GET /health", r.status_code == 200, r.text.strip())

body = {
    "username": u,
    "email": f"{u}@mail.com",
    "password": "Clave123",
    "confirmPassword": "Clave123",
    "profileImageUrl": "https://example.com/profiles/p.png",
}
r = requests.post(f"{BASE}/api/auth/register", json=body)
check("POST /api/auth/register", r.status_code == 201, r.text.strip())
r = requests.post(f"{BASE}/api/auth/register", json=body)
check("Registro duplicado -> 409", r.status_code == 409)
r = requests.post(
    f"{BASE}/api/auth/register",
    json={**body, "username": u + "x", "confirmPassword": "otra"},
)
check("Contraseñas distintas -> 400", r.status_code == 400)

r = requests.post(f"{BASE}/api/auth/login", json={"username": u, "password": "mala"})
check("Login malo -> 401", r.status_code == 401)
r = requests.post(
    f"{BASE}/api/auth/login", json={"username": u, "password": "Clave123"}
)
check("POST /api/auth/login", r.status_code == 200)
H = {"Authorization": "Bearer " + r.json()["token"]}

check("Tareas sin token -> 401", requests.get(f"{BASE}/api/tasks").status_code == 401)
r = requests.post(
    f"{BASE}/api/tasks", json={"title": "Tarea 1", "description": "desc"}, headers=H
)
check("POST /api/tasks", r.status_code == 201)
tid = r.json()["id"]
r = requests.put(f"{BASE}/api/tasks/{tid}", json={"title": "Editada"}, headers=H)
check("PUT /api/tasks/:id", r.status_code == 200 and r.json()["title"] == "Editada")
r = requests.patch(
    f"{BASE}/api/tasks/{tid}/complete", json={"completed": True}, headers=H
)
check(
    "PATCH /api/tasks/:id/complete",
    r.status_code == 200 and r.json()["completed"] is True,
)
r = requests.get(f"{BASE}/api/tasks", headers=H)
check("GET /api/tasks", r.status_code == 200 and len(r.json()) == 1)
r = requests.delete(f"{BASE}/api/tasks/{tid}", headers=H)
check("DELETE /api/tasks/:id", r.status_code == 200)
r = requests.delete(f"{BASE}/api/tasks/{tid}", headers=H)
check("Borrar inexistente -> 404", r.status_code == 404)

r = requests.post(
    f"{BASE}/api/files",
    headers=H,
    json={"name": "nota.txt", "type": "text", "url": "https://example.com/texts/nota.txt"},
)
check(
    "POST /api/files (texto)",
    r.status_code == 201 and r.json()["type"] == "text",
    r.text.strip(),
)
fid = r.json()["id"]
r = requests.post(
    f"{BASE}/api/files",
    headers=H,
    json={"name": "foto.png", "type": "image", "url": "https://example.com/images/foto.png"},
)
check("POST /api/files (imagen)", r.status_code == 201 and r.json()["type"] == "image")
r = requests.post(
    f"{BASE}/api/files", headers=H, json={"name": "x", "type": "otro", "url": "https://e.com/x"}
)
check("Tipo inválido -> 400", r.status_code == 400)
r = requests.post(f"{BASE}/api/files", headers=H, json={"name": "x", "url": "ftp://e.com/x"})
check("URL no http(s) -> 400", r.status_code == 400)
r = requests.get(f"{BASE}/api/files", headers=H)
check("GET /api/files", r.status_code == 200 and len(r.json()) == 2)
r = requests.get(f"{BASE}/api/files/{fid}", headers=H)
check("GET /api/files/:id", r.status_code == 200)

print("\nRESULTADO:", "TODO OK" if ok else "HAY FALLOS")
sys.exit(0 if ok else 1)
