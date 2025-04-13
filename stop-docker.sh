#!/bin/bash

echo "==============================================="
echo "Zatrzymywanie aplikacji OptiQ Terminal w Dockerze"
echo "==============================================="

# Sprawdź, czy Docker jest zainstalowany
if ! command -v docker &> /dev/null; then
    echo "Docker nie jest zainstalowany."
    exit 1
fi

echo ""
echo "Zatrzymywanie i usuwanie kontenerów..."
echo "------------------------------------"

# Zatrzymaj i usuń kontenery, sieci, woluminy i obrazy związane z aplikacją
sudo docker compose down

echo ""
echo "Sprawdzanie statusu zatrzymania..."
echo "--------------------------------"
if [ "$(sudo docker ps -q -f name=terminal)" ] || [ "$(sudo docker ps -q -f name=stockcharts)" ]; then
    echo "⚠️ Uwaga: Nadal istnieją uruchomione kontenery:"
    sudo docker ps -f name=terminal
    sudo docker ps -f name=stockcharts
    echo "Próba zatrzymania wszystkich kontenerów związanych z aplikacją..."
    sudo docker stop $(sudo docker ps -q -f name=terminal) 2>/dev/null || true
    sudo docker stop $(sudo docker ps -q -f name=stockcharts) 2>/dev/null || true
else
    echo "✅ Wszystkie kontenery zostały zatrzymane pomyślnie."
fi

echo ""
echo "==============================================="
echo "Kontenery zatrzymane i usunięte."
echo "==============================================="
echo ""
echo "Aby ponownie uruchomić aplikację w trybie WATCHER, użyj:"
echo "  ./start-docker.sh"
echo "===============================================" 