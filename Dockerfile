FROM python:3.12-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code from backend/
COPY backend/app ./app
COPY backend/scripts ./scripts

# Download pitch database from GitHub release (pre-built with goshu, ~16MB)
# Checksum verified for v1.0.0
RUN mkdir -p data && python scripts/download_dictionary.py --force

# Download UniDic dictionary for runtime cross-validation (~770MB)
# This is optional but improves accuracy. Remove this line for smaller images.
RUN python -m unidic download

# Expose port
EXPOSE 8000

# Run the application (Railway sets PORT env var)
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
