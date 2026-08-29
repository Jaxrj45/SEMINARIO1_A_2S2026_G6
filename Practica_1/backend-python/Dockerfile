# CloudCinema - Backend Python/Flask (imagen de produccion)
# Se sirve con gunicorn, NO con el servidor de desarrollo de Flask.

FROM python:3.12-slim AS runtime

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PORT=3000 \
    GUNICORN_WORKERS=3 \
    GUNICORN_THREADS=4

WORKDIR /app

COPY requirements.txt ./
RUN pip install --no-cache-dir --upgrade pip \
    && pip install --no-cache-dir -r requirements.txt

COPY app.py ./
COPY src ./src

# Usuario sin privilegios para no correr como root dentro del contenedor.
RUN useradd --system --no-create-home --shell /usr/sbin/nologin appuser \
    && chown -R appuser:appuser /app
USER appuser

EXPOSE 3000
CMD ["sh", "-c", "exec gunicorn --bind 0.0.0.0:${PORT} --workers ${GUNICORN_WORKERS} --threads ${GUNICORN_THREADS} --timeout 60 --graceful-timeout 30 --access-logfile - --error-logfile - app:app"]
