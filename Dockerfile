# --- Stage 1: Builder ---
FROM python:3.11-slim AS builder

WORKDIR /build

# Install build dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    python3-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install dependencies to a specific prefix
COPY requirements.txt .
RUN pip install --no-cache-dir --prefix=/install -r requirements.txt

# --- Stage 2: Runtime ---
FROM python:3.11-slim

WORKDIR /app

# Install runtime dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    libgomp1 \
    && rm -rf /var/lib/apt/lists/*

# Create non-root user for security
RUN useradd -m -u 1000 appuser

# Copy installed python packages from builder
# We use /usr/local to ensure they are in the default Python path
COPY --from=builder /install /usr/local

# Copy application code and set ownership
COPY --chown=appuser:appuser . .

# Ensure the video directory exists and is writable by appuser
RUN mkdir -p /app/static/videos && chown -R appuser:appuser /app/static/videos

# Set environment variables
ENV PYTHONUNBUFFERED=1 \
    PORT=8080 \
    PYTHONDONTWRITEBYTECODE=1

# Switch to non-root user
USER appuser

# Health check (Note: Cloud Run has its own startup probes, 
# but this is good for local testing)
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8080/').read()" || exit 1

# Expose port (Informational for Cloud Run)
EXPOSE 8080

# Start application with gunicorn
# Note: We use the $PORT variable to be compliant with Cloud Run's dynamic port assignment
CMD gunicorn --bind 0.0.0.0:${PORT} --workers 1 --threads 8 --timeout 0 app:app