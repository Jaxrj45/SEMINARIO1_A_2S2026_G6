// auth.js
// Manejo de Autenticación (Login y Registro)

document.addEventListener("DOMContentLoaded", () => {
    
    // 1. Lógica de Login
    const loginForm = document.getElementById("loginForm");
    if (loginForm) {
        loginForm.addEventListener("submit", async (e) => {
            e.preventDefault(); // Evitamos que la página recargue
            
            // Capturamos los datos
            const username = document.getElementById("loginUsername").value.trim();
            const password = document.getElementById("loginPassword").value.trim();
            
            if (!username || !password) {
                alert("Por favor, ingresa tu usuario y contraseña.");
                return;
            }
            
            try {
                // Petición al Backend
                const response = await fetch(`${API_URL}/auth/login`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({ username, password })
                });
                
                const data = await response.json();
                
                if (response.ok) {
                    // Guardamos el token
                    localStorage.setItem("token", data.token);
                    // Redirigimos al Dashboard
                    window.location.href = "./index.html";
                } else {
                    alert(data.error || "Credenciales incorrectas");
                }
            } catch (error) {
                console.error("Error en login:", error);
                alert("Error al conectar con el servidor. Verifica que el backend esté encendido.");
            }
        });
    }

    // 2. Lógica de Registro 
    const registerForm = document.getElementById("registerForm");
    if (registerForm) {
        registerForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            
            // Capturamos los datos de texto
            const username = document.getElementById("registerFullName").value.trim();
            const email = document.getElementById("registerEmail").value.trim();
            const password = document.getElementById("registerPassword").value.trim();
            const confirmPassword = document.getElementById("registerConfirmPassword").value.trim();
            const profileImageInput = document.getElementById("profileImage");
            
            // Validaciones básicas
            if (!username || !email || !password || !confirmPassword) {
                alert("Por favor, completa todos los campos de texto.");
                return;
            }
            if (password !== confirmPassword) {
                alert("Las contraseñas no coinciden. Intenta de nuevo.");
                return;
            }
            if (profileImageInput.files.length === 0) {
                alert("Por favor, selecciona una imagen de perfil.");
                return;
            }
            
            const submitBtn = registerForm.querySelector('button[type="submit"]');
            const originalText = submitBtn.innerHTML;
            submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Subiendo foto...';
            submitBtn.disabled = true;

            try {
                // PASO 1: Subir la foto de perfil al API Gateway (Serverless)
                const profileImageFile = profileImageInput.files[0];
                const imageFormData = new FormData();
                imageFormData.append("file", profileImageFile);

                // Disparamos la imagen hacia el API Gateway
                const serverlessResponse = await fetch(SERVERLESS_URL, {
                    method: "POST",
                    body: imageFormData
                });

                if (!serverlessResponse.ok) {
                    throw new Error("Error al subir la imagen al API Gateway.");
                }

                // El Gateway nos responde con el link de la foto ya guardada en S3
                const imageData = await serverlessResponse.json();
                const profileImageUrl = imageData.url; 

                // PASO 2: Mandar los datos de texto + la URL de la foto al Backend (Load Balancer)
                submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Registrando...';
                
                // Armamos un JSON purito y limpio
                const registerPayload = {
                    username: username,
                    email: email,
                    password: password,
                    confirmPassword: confirmPassword,
                    profileImageUrl: profileImageUrl // Aquí va el texto del link!
                };

                const backendResponse = await fetch(`${API_URL}/auth/register`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify(registerPayload)
                });
                
                const data = await backendResponse.json();
                
                if (backendResponse.ok) {
                    alert("¡Registro exitoso! Ahora puedes iniciar sesión.");
                    window.location.href = "./login.html";
                } else {
                    alert(data.error || "Error al registrar el usuario.");
                }
            } catch (error) {
                console.error("Error en registro:", error);
                alert("Error de conexión: Verifica que el link del SERVERLESS_URL sea correcto y el backend esté encendido.");
            } finally {
                submitBtn.innerHTML = originalText;
                submitBtn.disabled = false;
            }
        });
    }
});
