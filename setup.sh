#!/bin/bash

echo "==============================================="
echo "Przygotowywanie środowiska dla aplikacji StockCharts"
echo "==============================================="

# Sprawdź, czy Python jest zainstalowany
if ! command -v python3 &> /dev/null; then
    echo "Python3 nie jest zainstalowany. Zainstaluj Python 3.8+ i uruchom skrypt ponownie."
    exit 1
fi

# Sprawdź, czy pip jest zainstalowany
if ! command -v pip3 &> /dev/null; then
    echo "pip3 nie jest zainstalowany. Zainstaluj pip i uruchom skrypt ponownie."
    exit 1
fi

# Sprawdź, czy npm jest zainstalowany
if ! command -v npm &> /dev/null; then
    echo "npm nie jest zainstalowany. Zainstaluj Node.js i npm, a następnie uruchom skrypt ponownie."
    exit 1
fi

# Sprawdź, czy Angular CLI jest zainstalowany, a jeśli nie, zainstaluj go globalnie
if ! command -v ng &> /dev/null; then
    echo "Angular CLI nie jest zainstalowany. Instaluję Angular CLI globalnie..."
    npm install -g @angular/cli
fi

echo ""
echo "Konfigurowanie backendu..."
echo "-------------------------"

# Przejdź do katalogu backendu
cd backend

# Usuń istniejące venv, jeśli istnieje
if [ -d "venv" ]; then
    echo "Usuwanie istniejącego środowiska wirtualnego..."
    rm -rf venv
fi

# Utwórz nowe wirtualne środowisko Pythona
echo "Tworzenie nowego środowiska wirtualnego..."
python3 -m venv venv

# Aktywuj środowisko wirtualne
echo "Aktywowanie środowiska wirtualnego..."
source venv/bin/activate

# Zainstaluj zależności Pythona
echo "Instalowanie zależności Pythona..."
pip install -r requirements.txt

# Tworzenie pliku .env z przykładowego pliku
if [ ! -f ".env" ]; then
    echo "Tworzenie pliku .env z szablonu..."
    cp .env.example .env
    echo "UWAGA: Pamiętaj, aby edytować plik .env i dodać swój klucz API Alpha Vantage!"
fi

# Dezaktywuj środowisko wirtualne
deactivate

# Wróć do katalogu głównego
cd ..

echo ""
echo "Konfigurowanie frontendu..."
echo "--------------------------"

# Przejdź do katalogu frontendu
cd frontend/stock-charts-app

# Instalowanie zależności npm
echo "Instalowanie zależności npm..."
npm install

# Instalowanie dodatkowych pakietów
echo "Instalowanie dodatkowych pakietów (Highcharts, FontAwesome)..."
npm install highcharts highcharts-angular @fortawesome/fontawesome-free

# Wróć do katalogu głównego
cd ../..

echo ""
echo "==============================================="
echo "Konfiguracja zakończona pomyślnie!"
echo "==============================================="
echo ""
echo "Aby uruchomić aplikację, wykonaj:"
echo "./run.sh"
echo ""
echo "UWAGA: Pamiętaj, aby zedytować plik backend/.env i dodać swój klucz API Alpha Vantage!"
echo "==============================================="

# Nadaj uprawnienia do wykonania dla run.sh
chmod +x run.sh 