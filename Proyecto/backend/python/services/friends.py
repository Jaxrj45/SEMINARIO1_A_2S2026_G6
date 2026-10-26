from db import query


def are_friends(user_a, user_b):
    """True si los dos usuarios son amigos (solicitud aceptada).
    Tambien lo puede usar el chat para validar a quien se le escribe."""
    rows = query(
        """SELECT 1 FROM amistades
            WHERE usuario_menor = LEAST(%s, %s)
              AND usuario_mayor = GREATEST(%s, %s)
              AND estado = 'accepted'
            LIMIT 1""",
        (user_a, user_b, user_a, user_b),
    )
    return len(rows) > 0
