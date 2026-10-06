// files.js
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
        document.getElementById("navUserImage").src = `https://ui-avatars.com/api/?name=${payload.username}&background=2563eb&color=fff`;
        document.getElementById("menuUserImage").src = `https://ui-avatars.com/api/?name=${payload.username}&background=2563eb&color=fff`;
    } catch (e) {}

    // Logout
    document.getElementById("btnLogout").addEventListener("click", () => {
        localStorage.removeItem("token");
        window.location.href = "./login.html";
    });

    const filesContainer = document.getElementById("filesContainer");
    const fileForm = document.getElementById("fileForm");
    
    // Cargar Archivos
    async function fetchFiles() {
        try {
            const response = await fetch(`${API_URL}/files`, {
                headers: { "Authorization": `Bearer ${token}` }
            });
            
            if (response.status === 401) {
                localStorage.removeItem("token");
                window.location.href = "./login.html";
                return;
            }
            
            const files = await response.json();
            renderFiles(files);
        } catch (error) {
            console.error("Error fetching files:", error);
            filesContainer.innerHTML = `<div class="col-12 text-center text-danger mt-5">Error de conexión con el servidor.</div>`;
        }
    }

    // Funciones Helper para íconos
    function getFileIcon(type) {
        if (type.includes("image")) return "bi-file-earmark-image text-primary";
        if (type.includes("text") || type.includes("pdf")) return "bi-file-earmark-text text-success";
        return "bi-file-earmark-zip text-secondary";
    }

    // Renderizar Archivos
    function renderFiles(files) {
        filesContainer.innerHTML = ""; 
        
        if (!files || files.length === 0) {
            filesContainer.innerHTML = `<div class="col-12 text-center mt-5 text-muted"><h4>Aún no has subido archivos.</h4><p>Sube tu primer archivo en la nube haciendo clic arriba a la derecha.</p></div>`;
            return;
        }

        files.forEach(f => {
            const date = new Date(f.createdAt).toLocaleString('es-ES', { dateStyle: 'medium' });
            const icon = getFileIcon(f.type);
            const isImage = f.type.includes("image");
            
            // Si es imagen, mostramos la miniatura, si no, un gran ícono
            const previewHtml = isImage 
                ? `<img src="${f.url}" class="card-img-top" style="height: 150px; object-fit: cover;" alt="${f.name}">`
                : `<div class="d-flex align-items-center justify-content-center bg-body-tertiary" style="height: 150px;"><i class="bi ${icon}" style="font-size: 4rem;"></i></div>`;

            const card = document.createElement("div");
            card.className = "col-sm-6 col-md-4 col-lg-3 mb-4";
            card.innerHTML = `
                <div class="card card-task h-100 bg-body">
                    ${previewHtml}
                    <div class="card-body">
                        <h6 class="card-title text-truncate" title="${f.name}">${f.name}</h6>
                        <p class="card-text text-muted small mb-3">Subido el: ${date}</p>
                        <a href="${f.url}" target="_blank" class="btn btn-sm btn-outline-primary w-100">
                            <i class="bi bi-cloud-arrow-down me-1"></i> Ver / Descargar
                        </a>
                    </div>
                </div>
            `;
            filesContainer.appendChild(card);
        });
    }

    // Subir Archivo 
    fileForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const fileInput = document.getElementById("fileUpload");
        if (fileInput.files.length === 0) return;
        
        const file = fileInput.files[0];
        if (file.size > 10 * 1024 * 1024) {
            alert("El archivo supera el límite de 10 MB.");
            return;
        }

        const submitBtn = fileForm.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Subiendo a S3...';
        submitBtn.disabled = true;
        
        try {
            // PASO 1: Subir el archivo físico al API Gateway (Lambda)
            const formData = new FormData();
            formData.append("file", file);
            
            const serverlessResponse = await fetch(SERVERLESS_URL, {
                method: "POST",
                headers: { "Authorization": `Bearer ${token}` },
                body: formData
            });

            if (!serverlessResponse.ok) {
                throw new Error("Error en el API Gateway al subir el archivo.");
            }

            // El Lambda nos devuelve la URL pública del archivo en S3
            const fileData = await serverlessResponse.json();
            // Esperamos que devuelva: { "name": "...", "type": "...", "url": "https://..." }

            // PASO 2: Registrar esa URL en nuestro Backend (Load Balancer -> RDS)
            submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Guardando en DB...';

            const backendResponse = await fetch(`${API_URL}/files`, {
                method: "POST",
                headers: { 
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}` 
                },
                body: JSON.stringify({
                    name: fileData.name || file.name,
                    type: fileData.type || (file.type.includes("image") ? "image" : "other"),
                    url: fileData.url
                })
            });
            
            if (backendResponse.ok) {
                // Cerrar modal
                const modalEl = document.getElementById("fileModal");
                const modal = bootstrap.Modal.getInstance(modalEl);
                modal.hide();
                fileForm.reset();
                
                // Recargar archivos
                fetchFiles();
            } else {
                const data = await backendResponse.json();
                alert(data.error || "Error al registrar el archivo en la base de datos.");
            }
        } catch (error) {
            console.error(error);
            alert("Error de conexión: Verifica que el link del SERVERLESS_URL sea correcto.");
        } finally {
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
    });


});
