FROM python:3.12-slim

RUN pip install --no-cache-dir "psycopg[binary]==3.2.10"

WORKDIR /app
EXPOSE 8080
CMD ["python", "servidor.py"]
