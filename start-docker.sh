#!/bin/bash

echo "==============================================="
echo "Uruchamianie aplikacji OptiQ Terminal w Dockerze (tryb WATCHER)"
echo "==============================================="

# Sprawdź, czy Docker jest zainstalowany
if ! command -v docker &> /dev/null; then
    echo "Docker nie jest zainstalowany. Zainstaluj Docker i uruchom skrypt ponownie."
    exit 1
fi

echo ""
echo "Zatrzymywanie istniejących kontenerów..."
echo "--------------------------------------------"

# Zatrzymaj istniejące kontenery, jeśli istnieją
sudo docker compose down 2>/dev/null || true

echo ""
echo "Budowanie i uruchamianie kontenerów Docker w trybie WATCHER..."
echo "------------------------------------------------------------"
echo "▶ Aplikacja będzie automatycznie przeładowywana przy zmianach plików"
echo "▶ Ctrl+C aby zatrzymać kontenery"
echo ""

# Buduj i uruchom kontenery
if ! sudo docker compose up --build; then
    echo ""
    echo "==============================================="
    echo "UWAGA: Wystąpił błąd podczas uruchamiania kontenerów!"
    echo "==============================================="
    echo ""
    echo "Możliwe przyczyny:"
    echo "1. Problemy z zależnościami npm"
    echo "2. Problemy z konfiguracją Dockera"
    echo "3. Port 4300 lub 5050 jest już zajęty"
    echo ""
    echo "Sprawdzam logi błędów backendu..."
    sudo docker logs terminal-backend 2>/dev/null || sudo docker logs stockcharts-backend
    echo ""
    echo "Spróbuj:"
    echo "1. Uruchomić ./clean-docker.sh aby wyczyścić zasoby Docker"
    echo "2. Sprawdzić, czy porty 4300 i 5050 są wolne (komenda: sudo lsof -i :4300,:5050)"
    echo "3. Sprawdzić logi powyżej, aby zidentyfikować problem"
    echo "==============================================="
    exit 1
fi

echo ""
echo "==============================================="
echo "Kontenery uruchomione w trybie WATCHER!"
echo "==============================================="
echo ""
echo "Aplikacja będzie dostępna pod adresem:"
echo "Frontend: http://localhost:4300"
echo "Backend API: http://localhost:5050/api"
echo "Backend Info: http://localhost:5050/api/status"
echo ""
echo "Pliki są automatycznie obserwowane w czasie rzeczywistym."
echo "Zmiany będą automatycznie przeładowywane w aplikacji."
echo "===============================================" 