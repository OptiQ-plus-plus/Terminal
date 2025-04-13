#!/bin/bash

echo "==============================================="
echo "Całkowite usuwanie zasobów Docker dla OptiQ Terminal"
echo "==============================================="

# Sprawdź, czy Docker jest zainstalowany
if ! command -v docker &> /dev/null; then
    echo "Docker nie jest zainstalowany."
    exit 1
fi

echo ""
echo "Zatrzymywanie i usuwanie kontenerów..."
echo "------------------------------------"

# Zatrzymaj i usuń kontenery, sieci i woluminy związane z aplikacją
sudo docker compose down

echo ""
echo "Usuwanie obrazów Docker związanych z aplikacją..."
echo "-----------------------------------------------"

# Usuń obrazy związane z aplikacją
echo "Próba usunięcia obrazu terminal-frontend..."
sudo docker image rm terminal-frontend 2>/dev/null && echo "✓ Usunięto obraz terminal-frontend" || echo "✕ Nie znaleziono obrazu terminal-frontend"

echo "Próba usunięcia obrazu terminal-backend..."
sudo docker image rm terminal-backend 2>/dev/null && echo "✓ Usunięto obraz terminal-backend" || echo "✕ Nie znaleziono obrazu terminal-backend"

echo "Próba usunięcia obrazu stockcharts-frontend..."
sudo docker image rm stockcharts-frontend 2>/dev/null && echo "✓ Usunięto obraz stockcharts-frontend" || echo "✕ Nie znaleziono obrazu stockcharts-frontend"

echo "Próba usunięcia obrazu stockcharts-backend..."
sudo docker image rm stockcharts-backend 2>/dev/null && echo "✓ Usunięto obraz stockcharts-backend" || echo "✕ Nie znaleziono obrazu stockcharts-backend"

echo ""
echo "Usuwanie nieużywanych obrazów, kontenerów i woluminów..."
echo "-----------------------------------------------------"

# Usuń nieużywane obrazy, kontenery i woluminy
sudo docker system prune -f

echo ""
echo "Sprawdzanie aktualnego stanu Docker..."
echo "-------------------------------------"
echo "Działające kontenery:"
sudo docker ps

echo ""
echo "==============================================="
echo "Wszystkie zasoby Docker dla aplikacji zostały usunięte."
echo "===============================================" 