#!/bin/bash

echo "==============================================="
echo "Uruchamianie aplikacji StockCharts"
echo "==============================================="

# Sprawdź, czy skrypt setup.sh został uruchomiony (sprawdź czy venv istnieje)
if [ ! -d "backend/venv" ]; then
    echo "Nie znaleziono środowiska wirtualnego w backend/venv."
    echo "Uruchom najpierw skrypt setup.sh, aby przygotować środowisko."
    echo "  ./setup.sh"
    exit 1
fi

# Sprawdź, czy klucz API Alpha Vantage został dodany do pliku .env
if grep -q "ALPHA_VANTAGE_API_KEY=your_alpha_vantage_api_key" "backend/.env"; then
    echo "UWAGA: Wygląda na to, że nie dodałeś swojego klucza API Alpha Vantage do pliku backend/.env."
    echo "Edytuj plik backend/.env i zastąp 'your_alpha_vantage_api_key' swoim kluczem API."
    read -p "Czy kontynuować mimo to? (t/n): " kontynuuj
    if [[ $kontynuuj != "t" && $kontynuuj != "T" ]]; then
        exit 1
    fi
fi

# Funkcja do uruchamiania terminala z komendą w zależności od środowiska
function uruchom_terminal {
    title=$1
    command=$2
    
    # Wykryj dostępny terminal
    if command -v gnome-terminal &> /dev/null; then
        gnome-terminal --title="$title" -- bash -c "$command"
    elif command -v xterm &> /dev/null; then
        xterm -title "$title" -e "$command" &
    elif command -v konsole &> /dev/null; then
        konsole --new-tab -p tabtitle="$title" -e "$command" &
    elif command -v terminator &> /dev/null; then
        terminator -T "$title" -e "$command" &
    else
        echo "Nie można znaleźć żadnego terminala. Uruchamiam w tle."
        bash -c "$command" &
    fi
}

echo ""
echo "Uruchamianie backendu..."
echo "------------------------"

# Przygotuj komendę do uruchomienia backendu
BACKEND_CMD="cd $(pwd)/backend && source venv/bin/activate && python -m presentation.app; exec bash"

# Uruchom backend w nowym oknie terminala
uruchom_terminal "StockCharts Backend" "$BACKEND_CMD"

echo "Backend uruchomiony w nowym oknie terminala."
echo "API będzie dostępne pod adresem: http://localhost:5000/api"

echo ""
echo "Uruchamianie frontendu..."
echo "-------------------------"

# Przygotuj komendę do uruchomienia frontendu
FRONTEND_CMD="cd $(pwd)/frontend/stock-charts-app && ng serve --open; exec bash"

# Uruchom frontend w nowym oknie terminala
uruchom_terminal "StockCharts Frontend" "$FRONTEND_CMD"

echo "Frontend uruchomiony w nowym oknie terminala."
echo "Aplikacja będzie dostępna pod adresem: http://localhost:4200"

echo ""
echo "==============================================="
echo "Aplikacja StockCharts jest uruchamiana."
echo "Poczekaj chwilę, aż obie usługi się uruchomią."
echo "===============================================" 