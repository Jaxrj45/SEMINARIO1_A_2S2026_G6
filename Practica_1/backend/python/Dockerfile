FROM python:3.12-slim

WORKDIR /app

# Las dependencias se instalan primero para aprovechar la cache de Docker
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# El contenedor NO corre como root
RUN useradd --create-home appuser && chown -R appuser:appuser /app
USER appuser

ENV PORT=3000
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://127.0.0.1:3000/health')" || exit 1

# gunicorn en lugar del servidor de desarrollo de Flask,
# que no debe usarse detras del balanceador de carga.
CMD ["gunicorn", "--bind", "0.0.0.0:3000", "--workers", "2", "app:app"]
