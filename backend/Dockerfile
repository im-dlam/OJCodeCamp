FROM python:3.10-slim

WORKDIR /app

# Install system dependencies (gcc, g++ for Judge compilation)
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .

# Install Python packages
RUN pip install --no-cache-dir -r requirements.txt

# Copy source code
COPY . .

# Expose backend API port
EXPOSE 8000

# Default command to run FastAPI backend
CMD ["uvicorn", "backend.app.main:app", "--host", "--workers=4","0.0.0.0", "--port", "8000"]