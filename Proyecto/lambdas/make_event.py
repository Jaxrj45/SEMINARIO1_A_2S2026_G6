"""Genera eventos de prueba para las Lambdas a partir de fotos reales.

Uso:
    python make_event.py post  foto.jpg                         -> evento_post.json
    python make_event.py face  selfie2.jpg Fotos_Perfil/x.jpg   -> evento_face.json

Pega el contenido del JSON generado en la pestaña "Test" de la consola de Lambda.
No subas a Git los eventos generados (son pesados): ya están ignorados en .gitignore.
"""
import base64
import json
import sys


def b64(path):
    with open(path, "rb") as f:
        return base64.b64encode(f.read()).decode()


def content_type(path):
    return "image/png" if path.lower().endswith(".png") else "image/jpeg"


def main():
    if len(sys.argv) < 3:
        print(__doc__)
        sys.exit(1)

    modo, foto = sys.argv[1], sys.argv[2]

    if modo == "post":
        evento = {"fileName": foto, "contentType": content_type(foto), "imageBase64": b64(foto)}
        salida = "evento_post.json"
    elif modo == "face" and len(sys.argv) == 4:
        evento = {"sourceBase64": b64(foto), "targetKey": sys.argv[3]}
        salida = "evento_face.json"
    else:
        print(__doc__)
        sys.exit(1)

    with open(salida, "w") as f:
        json.dump(evento, f)
    print(f"Listo: {salida}")


if __name__ == "__main__":
    main()
