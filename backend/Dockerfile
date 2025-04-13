FROM python:3.11-slim

WORKDIR /app

# Kopiowanie plików wymagań
COPY requirements.txt .

# Instalacja zależności
RUN pip install -r requirements.txt

# Kopiowanie reszty aplikacji
COPY . .

# Ustawienie zmiennych środowiskowych
ENV FLASK_APP=presentation/app.py
ENV FLASK_ENV=development
ENV PYTHONPATH=/app
ENV FLASK_DEBUG=1

# Otwarcie portu
EXPOSE 5000

# Uruchomienie aplikacji z hot-reloadem i lepszym watcherem
CMD ["python", "-m", "flask", "run", "--host=0.0.0.0", "--port=5000", "--reload", "--debugger", "--extra-files=**/*.py"] 