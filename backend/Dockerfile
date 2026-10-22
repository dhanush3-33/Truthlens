# TruthLens AI backend — Hugging Face Spaces (Docker) image
FROM python:3.12-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# HF Spaces routes traffic to the port in the Space settings;7860 is the default.
ENV PORT=7860
EXPOSE7860

CMD ["python", "app.py"]
