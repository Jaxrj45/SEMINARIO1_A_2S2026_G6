import { ENDPOINTS } from "./config";
import md5 from "md5";

// Función para obtener todas las películas de la cartelera
export async function getMovies() {
  try {
    const response = await fetch(ENDPOINTS.movies);
    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status}`);
    }
    const data = await response.json();
    return data; // Debería devolver un arreglo de películas
  } catch (error) {
    console.error("Error al obtener películas:", error);
    return []; // Si hay error, devolvemos vacío para no romper la página
  }
}

// Función para iniciar sesión
export async function loginUser(correo, password) {
  try {
    const response = await fetch(ENDPOINTS.login, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ correo, password: md5(password) })
    });
    const data = await response.json();
    return { ok: response.ok, data };
  } catch (error) {
    console.error("Error en login:", error);
    return { ok: false, error: { error: error.message } };
  }
}

// Función para registrar un usuario
export async function registerUser(formData) {
  try {
    const password = formData.get("password");
    if (password) {
      formData.set("password", md5(password));
    }
    const password_confirm = formData.get("password_confirm");
    if (password_confirm) {
      formData.set("password_confirm", md5(password_confirm));
    }
    const response = await fetch(ENDPOINTS.register, {
      method: "POST",
      body: formData // Fetch se encarga automáticamente de los boundaries de FormData
    });
    const data = await response.json().catch(() => ({}));
    return { ok: response.ok, data };
  } catch (error) {
    console.error("Error en registro:", error);
    return { ok: false, error: { error: error.message } };
  }
}

// Función para actualizar perfil
export async function updateProfile(formData) {
  try {
    const password = formData.get("password");
    if (password) {
      formData.set("password", md5(password)); // MD5 the current password
    }
    const response = await fetch(ENDPOINTS.profile, {
      method: "PUT",
      body: formData
    });
    const data = await response.json().catch(() => ({}));
    return { ok: response.ok, data };
  } catch (error) {
    console.error("Error al actualizar perfil:", error);
    return { ok: false, error: { error: error.message } };
  }
}

// Función para obtener la lista de reproducción
export async function getPlaylist(id_usuario) {
  try {
    const response = await fetch(`${ENDPOINTS.playlist}?id_usuario=${id_usuario}`);
    if (!response.ok) throw new Error("Error fetching playlist");
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error al obtener playlist:", error);
    return [];
  }
}

// Función para añadir a la lista
export async function addToPlaylist(id_usuario, id_pelicula) {
  try {
    const response = await fetch(ENDPOINTS.playlist, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id_usuario, id_pelicula })
    });
    const data = await response.json().catch(() => ({}));
    return { ok: response.ok, data };
  } catch (error) {
    return { ok: false, error: { error: error.message } };
  }
}

// Función para quitar de la lista
export async function removeFromPlaylist(id_lista, id_usuario) {
  try {
    const response = await fetch(`${ENDPOINTS.playlist}/${id_lista}?id_usuario=${id_usuario}`, {
      method: "DELETE"
    });
    const data = await response.json().catch(() => ({}));
    return { ok: response.ok, data };
  } catch (error) {
    return { ok: false, error: { error: error.message } };
  }
}