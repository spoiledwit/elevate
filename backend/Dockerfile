FROM python:3.13-slim-bookworm

ENV PYTHONUNBUFFERED=1
ENV UV_PROJECT_ENVIRONMENT=/.venv

WORKDIR /app

COPY pyproject.toml uv.lock ./

RUN pip install uv && \
    uv venv && \
    uv sync && \
    mkdir -p /app/logs

EXPOSE 8000
