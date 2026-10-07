// auth.js
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
                const response = await fetch(`${API_URL}/auth/login`, {
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
                const backendResponse = await fetch(`${API_URL}/auth/register`, {
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
