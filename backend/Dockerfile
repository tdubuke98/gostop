FROM python:3.9-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY *.py ./
LABEL "com.datadoghq.ad.logs"='[{"source": "gunicorn", "service": "gostop_backend"}]'

EXPOSE 8000

CMD ["ddtrace-run", "gunicorn", "-w", "4", "-b", "0.0.0.0:8000", "gostop_flask:app"]
