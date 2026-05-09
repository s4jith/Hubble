# Hugging Face Spaces — Hubble AI Engine
FROM python:3.12-slim

# HF Spaces requires port 7860
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV HOST=0.0.0.0
ENV PORT=7860

WORKDIR /app

# System dependencies for OpenCV and native builds
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libgl1 \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir torch torchvision --index-url https://download.pytorch.org/whl/cpu && \
    pip install --no-cache-dir -r requirements.txt --extra-index-url https://download.pytorch.org/whl/cpu

COPY . .

# HF Spaces runs containers as a non-root user (UID 1000)
RUN useradd -m -u 1000 user
RUN mkdir -p /tmp/model_cache && chown -R user:user /tmp/model_cache && chown -R user:user /app
USER user

EXPOSE 7860

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "7860"]
