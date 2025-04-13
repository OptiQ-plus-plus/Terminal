#!/bin/bash

echo "==============================================="
echo "Uruchamianie aplikacji StockCharts w Dockerze"
echo "==============================================="

# Sprawdź, czy Docker jest zainstalowany
if ! command -v docker &> /dev/null; then
    echo "Docker nie jest zainstalowany. Zainstaluj Docker i uruchom skrypt ponownie."
    exit 1
fi

echo ""
echo "Budowanie i uruchamianie kontenerów Docker..."
echo "--------------------------------------------"

# Zatrzymaj istniejące kontenery, jeśli istnieją
docker compose down

# Buduj i uruchom kontenery
docker compose up --build

echo ""
echo "==============================================="
echo "Kontenery uruchomione!"
echo "==============================================="
echo ""
echo "Aplikacja będzie dostępna pod adresem:"
echo "Frontend: http://localhost"
echo "Backend API: http://localhost:5000/api"
echo ""
echo "Aby zobaczyć logi aplikacji:"
echo "docker compose logs -f"
echo ""
echo "Aby zatrzymać aplikację:"
echo "docker compose down"
echo "===============================================" 