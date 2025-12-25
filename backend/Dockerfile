FROM python:3.12-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Download UniDic dictionary for goshu classification (~770MB)
RUN python -m unidic download

# Create data directory and import pitch database with goshu
RUN mkdir -p data && python scripts/import_kanjium.py && python scripts/import_goshu.py

# Expose port
EXPOSE 8000

# Run the application (Railway sets PORT env var)
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
