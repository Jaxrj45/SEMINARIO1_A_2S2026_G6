from db import query

# Nunca se selecciona password_md5 para devolverlo
USER_COLUMNS = "id, username, nombre_completo, email, dpi, foto_key, creado_en"


def find_user_by_id(user_id):
    rows = query(f"SELECT {USER_COLUMNS} FROM usuarios WHERE id = %s", (user_id,))
    return rows[0] if rows else None


def find_user_by_username(username):
    rows = query(f"SELECT {USER_COLUMNS} FROM usuarios WHERE username = %s", (username,))
    return rows[0] if rows else None


def find_user_by_cognito_sub(sub):
    rows = query(f"SELECT {USER_COLUMNS} FROM usuarios WHERE cognito_sub = %s", (sub,))
    return rows[0] if rows else None


def password_matches(user_id, password):
    """La contrasena se compara dentro de MySQL con MD5."""
    rows = query("SELECT password_md5 = MD5(%s) AS ok FROM usuarios WHERE id = %s", (password, user_id))
    return bool(rows) and rows[0]["ok"] == 1
