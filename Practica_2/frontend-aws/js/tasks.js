// tasks.js
document.addEventListener("DOMContentLoaded", () => {
    const token = localStorage.getItem("token");
    if (!token) {
        window.location.href = "./login.html";
        return;
    }

    // Decodificar JWT para sacar el username
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        document.getElementById("navUsername").textContent = payload.username;
        document.getElementById("dropdownUsername").innerHTML = `${payload.username} <small>Miembro de TaskFlow</small>`;
        // Como el token no trae la imagen, usaremos el avatar por defecto
        document.getElementById("navUserImage").src = `https://ui-avatars.com/api/?name=${payload.username}&background=2563eb&color=fff`;
        document.getElementById("menuUserImage").src = `https://ui-avatars.com/api/?name=${payload.username}&background=2563eb&color=fff`;
    } catch (e) {
        console.error("Token inválido");
    }

    // Logout
    document.getElementById("btnLogout").addEventListener("click", () => {
        localStorage.removeItem("token");
        window.location.href = "./login.html";
    });

    const tasksContainer = document.getElementById("tasksContainer");
    const taskForm = document.getElementById("taskForm");
    
    // Cargar Tareas
    async function fetchTasks() {
        try {
            const response = await fetch(`${API_URL}/tasks`, {
                headers: { "Authorization": `Bearer ${token}` }
            });
            
            if (response.status === 401) {
                localStorage.removeItem("token");
                window.location.href = "./login.html";
                return;
            }
            
            const tasks = await response.json();
            renderTasks(tasks);
        } catch (error) {
            console.error("Error fetching tasks:", error);
            tasksContainer.innerHTML = `<div class="col-12 text-center text-danger mt-5">Error de conexión con el servidor.</div>`;
        }
    }

    // Renderizar Tareas
    function renderTasks(tasks) {
        tasksContainer.innerHTML = ""; // Limpiar container (borra el spinner)
        
        if (!tasks || tasks.length === 0) {
            tasksContainer.innerHTML = `<div class="col-12 text-center mt-5 text-muted"><h4>No tienes tareas pendientes.</h4><p>Crea una nueva tarea haciendo clic en el botón superior derecho.</p></div>`;
            return;
        }

        tasks.forEach(task => {
            const isCompleted = task.completed;
            const bgClass = isCompleted ? "bg-body-secondary opacity-75" : "bg-body";
            const checkIcon = isCompleted ? "bi-check-circle-fill text-success" : "bi-circle text-secondary";
            const textClass = isCompleted ? "text-decoration-line-through text-muted" : "";

            // Formatear fecha
            const date = new Date(task.createdAt).toLocaleString('es-ES', { dateStyle: 'medium', timeStyle: 'short' });

            const card = document.createElement("div");
            card.className = "col-md-6 col-lg-4 mb-4";
            card.innerHTML = `
                <div class="card card-task h-100 ${bgClass}">
                    <div class="card-body">
                        <div class="d-flex justify-content-between align-items-start mb-2">
                            <h5 class="card-title fw-bold ${textClass}" style="cursor:pointer;" onclick="toggleTask(${task.id})">
                                <i class="bi ${checkIcon} me-2"></i>${task.title}
                            </h5>
                            <button class="btn btn-sm btn-outline-danger border-0" onclick="deleteTask(${task.id})">
                                <i class="bi bi-trash"></i>
                            </button>
                        </div>
                        <p class="card-text text-muted small mb-3 ${textClass}">${task.description || "Sin descripción"}</p>
                        <p class="card-text text-muted mb-0" style="font-size: 0.75rem;"><i class="bi bi-clock me-1"></i>${date}</p>
                    </div>
                </div>
            `;
            tasksContainer.appendChild(card);
        });
    }

    // Crear Tarea
    taskForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const title = document.getElementById("taskTitle").value.trim();
        const description = document.getElementById("taskDescription").value.trim();
        
        try {
            const response = await fetch(`${API_URL}/tasks`, {
                method: "POST",
                headers: { 
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}` 
                },
                body: JSON.stringify({ title, description })
            });
            
            if (response.ok) {
                // Cerrar modal
                const modalEl = document.getElementById("taskModal");
                const modal = bootstrap.Modal.getInstance(modalEl);
                modal.hide();
                taskForm.reset();
                
                // Recargar tareas
                fetchTasks();
            } else {
                alert("Error al crear la tarea");
            }
        } catch (error) {
            console.error(error);
        }
    });

    // Funciones globales para que el HTML pueda llamarlas desde onClick
    window.toggleTask = async function(id) {
        try {
            await fetch(`${API_URL}/tasks/${id}/complete`, {
                method: "PATCH",
                headers: { "Authorization": `Bearer ${token}` }
            });
            fetchTasks(); // Recargar
        } catch (error) {
            console.error(error);
        }
    };

    window.deleteTask = async function(id) {
        if(!confirm("¿Estás seguro de eliminar esta tarea?")) return;
        try {
            await fetch(`${API_URL}/tasks/${id}`, {
                method: "DELETE",
                headers: { "Authorization": `Bearer ${token}` }
            });
            fetchTasks(); // Recargar
        } catch (error) {
            console.error(error);
        }
    };

    // Inicializar
    fetchTasks();
});
