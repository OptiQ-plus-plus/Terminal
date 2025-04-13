#!/bin/bash

echo "==============================================="
echo "Całkowite usuwanie zasobów Docker dla StockCharts"
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
docker compose down

echo ""
echo "Usuwanie obrazów Docker związanych z aplikacją..."
echo "-----------------------------------------------"

# Usuń obrazy związane z aplikacją
echo "Próba usunięcia obrazu stockcharts-frontend..."
docker image rm stockcharts-frontend 2>/dev/null && echo "✓ Usunięto obraz stockcharts-frontend" || echo "✕ Nie znaleziono obrazu stockcharts-frontend"

echo "Próba usunięcia obrazu stockcharts-backend..."
docker image rm stockcharts-backend 2>/dev/null && echo "✓ Usunięto obraz stockcharts-backend" || echo "✕ Nie znaleziono obrazu stockcharts-backend"

echo "Próba usunięcia obrazu qchackhaton-frontend..."
docker image rm qchackhaton-frontend 2>/dev/null && echo "✓ Usunięto obraz qchackhaton-frontend" || echo "✕ Nie znaleziono obrazu qchackhaton-frontend"

echo "Próba usunięcia obrazu qchackhaton-backend..."
docker image rm qchackhaton-backend 2>/dev/null && echo "✓ Usunięto obraz qchackhaton-backend" || echo "✕ Nie znaleziono obrazu qchackhaton-backend"

echo ""
echo "Usuwanie nieużywanych obrazów, kontenerów i woluminów..."
echo "-----------------------------------------------------"

# Usuń nieużywane obrazy, kontenery i woluminy
docker system prune -f

echo ""
echo "Sprawdzanie aktualnego stanu Docker..."
echo "-------------------------------------"
echo "Działające kontenery:"
docker ps

echo ""
echo "==============================================="
echo "Wszystkie zasoby Docker dla aplikacji zostały usunięte."
echo "===============================================" 