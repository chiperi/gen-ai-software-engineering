# Virtual Card Lifecycle — runtime image (Python 3.12 / FastAPI)
FROM python:3.12-slim AS base
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1
WORKDIR /app

# Dependencies first (better layer caching)
COPY pyproject.toml ./
RUN pip install --upgrade pip && pip install .

# Application code
COPY . .

# Run as non-root (least privilege — constitution P5)
RUN useradd --create-home --uid 10001 appuser
USER appuser

EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
