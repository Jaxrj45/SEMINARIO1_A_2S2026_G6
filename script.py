import os
import codecs

# CONFIG AWS
aws_config = '''// config.js (VERSIÓN AWS)
const API_URL = "http://elb-g6-53192485.us-east-1.elb.amazonaws.com/api";
const SERVERLESS_URL_TEXTS = "https://v6vbfsjqyb.execute-api.us-east-1.amazonaws.com/textos";
const SERVERLESS_URL_IMAGES = "https://v6vbfsjqyb.execute-api.us-east-1.amazonaws.com/imagenes";
'''
with codecs.open('Practica_2/frontend-aws/js/config.js', 'w', 'utf-8') as f:
    f.write(aws_config)

# CONFIG AZURE
azure_config = '''// config.js (VERSIÓN AZURE)
const API_URL = "http://23.101.136.185/api";
const SERVERLESS_URL_TEXTS = "https://g6-apim.azure-api.net/serverless/textos";
const SERVERLESS_URL_IMAGES = "https://g6-apim.azure-api.net/serverless/imagenes";
'''
with codecs.open('Practica_2/frontend-azure/js/config.js', 'w', 'utf-8') as f:
    f.write(azure_config)

# AUTH.JS (Same for both, uses SERVERLESS_URL_IMAGES)
auth_content = '''// auth.js
document.addEventListener("DOMContentLoaded", () => {
    // 1. Lógica de Login
    const loginForm = document.getElementById("loginForm");
    if (loginForm) {
        loginForm.addEventListener("submit", async (e) => {
            e.preventDefault(); 
            const username = document.getElementById("loginUsername").value.trim();
            const password = document.getElementById("loginPassword").value.trim();
            if (!username || !password) return alert("Por favor, ingresa tu usuario y contraseña.");
            try {
                const response = await fetch(${API_URL}/auth/login, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ username, password })
                });
                const data = await response.json();
                if (response.ok) {
                    localStorage.setItem("token", data.token);
                    window.location.href = "./index.html";
                } else alert(data.error || "Credenciales incorrectas");
            } catch (error) { alert("Error al conectar con el servidor."); }
        });
    }

    // Convertir File a Base64
    const toBase64 = file => new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result.split(',')[1]);
        reader.onerror = error => reject(error);
    });

    // 2. Lógica de Registro
    const registerForm = document.getElementById("registerForm");
    if (registerForm) {
        registerForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            const username = document.getElementById("registerFullName").value.trim();
            const email = document.getElementById("registerEmail").value.trim();
            const password = document.getElementById("registerPassword").value.trim();
            const confirmPassword = document.getElementById("registerConfirmPassword").value.trim();
            const profileImageInput = document.getElementById("profileImage");
            
            if (!username || !email || !password || !confirmPassword) return alert("Completa todos los campos.");
            if (password !== confirmPassword) return alert("Las contraseñas no coinciden.");
            if (profileImageInput.files.length === 0) return alert("Selecciona una imagen de perfil.");
            
            const file = profileImageInput.files[0];
            if (file.size > 4 * 1024 * 1024) return alert("La imagen debe pesar menos de 4 MB.");

            const submitBtn = registerForm.querySelector('button[type="submit"]');
            const originalText = submitBtn.innerHTML;
            submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Subiendo foto...';
            submitBtn.disabled = true;

            try {
                // PASO 1: Base64
                const base64Data = await toBase64(file);
                
                // Disparamos hacia API Gateway de Imagenes
                const serverlessResponse = await fetch(SERVERLESS_URL_IMAGES, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        name: file.name,
                        contentType: file.type,
                        data: base64Data
                    })
                });

                if (!serverlessResponse.ok) throw new Error("Error en API Gateway");
                const imageData = await serverlessResponse.json();
                
                // PASO 2: Mandar al LB
                submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Registrando...';
                const backendResponse = await fetch(${API_URL}/auth/register, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        username: username,
                        email: email,
                        password: password,
                        confirmPassword: confirmPassword,
                        profileImageUrl: imageData.url
                    })
                });
                
                if (backendResponse.ok) {
                    alert("¡Registro exitoso! Ahora puedes iniciar sesión.");
                    window.location.href = "./login.html";
                } else {
                    const data = await backendResponse.json();
                    alert(data.error || "Error al registrar.");
                }
            } catch (error) { alert("Error de conexión durante el registro."); }
            finally { submitBtn.innerHTML = originalText; submitBtn.disabled = false; }
        });
    }
});
'''
with codecs.open('Practica_2/frontend-aws/js/auth.js', 'w', 'utf-8') as f: f.write(auth_content)
with codecs.open('Practica_2/frontend-azure/js/auth.js', 'w', 'utf-8') as f: f.write(auth_content)

# FILES.JS
files_content = '''// files.js
document.addEventListener("DOMContentLoaded", () => {
    const token = localStorage.getItem("token");
    if (!token) { window.location.href = "./login.html"; return; }

    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        document.getElementById("navUsername").textContent = payload.username;
        document.getElementById("dropdownUsername").innerHTML = ${payload.username} <small>Miembro de TaskFlow</small>;
        document.getElementById("navUserImage").src = https://ui-avatars.com/api/?name=&background=2563eb&color=fff;
        document.getElementById("menuUserImage").src = https://ui-avatars.com/api/?name=&background=2563eb&color=fff;
    } catch (e) {}

    document.getElementById("btnLogout").addEventListener("click", () => {
        localStorage.removeItem("token");
        window.location.href = "./login.html";
    });

    const filesContainer = document.getElementById("filesContainer");
    const fileForm = document.getElementById("fileForm");
    
    async function fetchFiles() {
        try {
            const response = await fetch(${API_URL}/files, {
                headers: { "Authorization": Bearer  }
            });
            if (response.status === 401) { localStorage.removeItem("token"); window.location.href = "./login.html"; return; }
            const files = await response.json();
            renderFiles(files);
        } catch (error) { filesContainer.innerHTML = <div class="col-12 text-center text-danger mt-5">Error de conexión.</div>; }
    }

    function getFileIcon(type) {
        if (type.includes("image")) return "bi-file-earmark-image text-primary";
        if (type.includes("text") || type.includes("pdf")) return "bi-file-earmark-text text-success";
        return "bi-file-earmark-zip text-secondary";
    }

    function renderFiles(files) {
        filesContainer.innerHTML = ""; 
        if (!files || files.length === 0) {
            filesContainer.innerHTML = <div class="col-12 text-center mt-5 text-muted"><h4>Aún no has subido archivos.</h4></div>;
            return;
        }
        files.forEach(f => {
            const date = new Date(f.createdAt).toLocaleString('es-ES', { dateStyle: 'medium' });
            const isImage = f.type.includes("image");
            const previewHtml = isImage 
                ? <img src="" class="card-img-top" style="height: 150px; object-fit: cover;">
                : <div class="d-flex align-items-center justify-content-center bg-body-tertiary" style="height: 150px;"><i class="bi " style="font-size: 4rem;"></i></div>;
            const card = document.createElement("div");
            card.className = "col-sm-6 col-md-4 col-lg-3 mb-4";
            card.innerHTML = 
                <div class="card card-task h-100 bg-body">
                    
                    <div class="card-body">
                        <h6 class="card-title text-truncate" title=""></h6>
                        <p class="card-text text-muted small mb-3">Subido: </p>
                        <a href="" target="_blank" class="btn btn-sm btn-outline-primary w-100"><i class="bi bi-cloud-arrow-down me-1"></i> Ver</a>
                    </div>
                </div>;
            filesContainer.appendChild(card);
        });
    }

    const toBase64 = file => new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result.split(',')[1]);
        reader.onerror = error => reject(error);
    });

    fileForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const fileInput = document.getElementById("fileUpload");
        if (fileInput.files.length === 0) return;
        const file = fileInput.files[0];
        
        if (file.size > 4 * 1024 * 1024) return alert("El archivo supera el límite de 4 MB.");

        const isImage = file.type.includes("image");
        const endpoint = isImage ? SERVERLESS_URL_IMAGES : SERVERLESS_URL_TEXTS;

        const submitBtn = fileForm.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Subiendo a S3/Blob...';
        submitBtn.disabled = true;
        
        try {
            const base64Data = await toBase64(file);
            
            const serverlessResponse = await fetch(endpoint, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: file.name,
                    contentType: file.type || "text/plain",
                    data: base64Data
                })
            });

            if (!serverlessResponse.ok) throw new Error("Error en el API Gateway al subir.");
            const fileData = await serverlessResponse.json();

            submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Guardando en DB...';
            const backendResponse = await fetch(${API_URL}/files, {
                method: "POST",
                headers: { "Content-Type": "application/json", "Authorization": Bearer  },
                body: JSON.stringify({
                    name: fileData.name || file.name,
                    type: fileData.type || (isImage ? "image" : "other"),
                    url: fileData.url
                })
            });
            
            if (backendResponse.ok) {
                bootstrap.Modal.getInstance(document.getElementById("fileModal")).hide();
                fileForm.reset();
                fetchFiles();
            } else {
                const data = await backendResponse.json();
                alert(data.error || "Error al registrar en la base de datos.");
            }
        } catch (error) { alert("Error de conexión al subir el archivo."); }
        finally { submitBtn.innerHTML = originalText; submitBtn.disabled = false; }
    });

    fetchFiles();
});
'''
with codecs.open('Practica_2/frontend-aws/js/files.js', 'w', 'utf-8') as f: f.write(files_content)
with codecs.open('Practica_2/frontend-azure/js/files.js', 'w', 'utf-8') as f: f.write(files_content)

print("Actualizacion completada con exito")
