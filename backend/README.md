# Backend Aplikacji do Wykresów Giełdowych

Backend do aplikacji wyświetlającej wykresy giełdowe zbudowany z wykorzystaniem podejścia Domain-Driven Design (DDD) w Pythonie z użyciem Flaska.

## Struktura projektu

Projekt jest zorganizowany zgodnie z zasadami DDD:

- **domain/** - Zawiera główną logikę biznesową
  - **entities/** - Encje domenowe (StockData, StockPrice, etc.)
  - **repositories/** - Interfejsy repozytoriów
  - **services/** - Usługi domenowe

- **application/** - Warstwa aplikacji (przypadki użycia)
  - **stock_application_service.py** - Usługa aplikacyjna do operacji na danych giełdowych

- **infrastructure/** - Implementacja infrastruktury
  - **apis/** - Klienty API (Alpha Vantage)
  - **repositories/** - Implementacje repozytoriów

- **presentation/** - Interfejsy użytkownika (API REST)
  - **app.py** - Główna aplikacja Flask z endpointami API

## Wymagania

- Python 3.8+
- Klucz API Alpha Vantage (dostępny na stronie [Alpha Vantage](https://www.alphavantage.co/support/#api-key))

## Instalacja

1. Sklonuj to repozytorium
2. Przejdź do katalogu backendu:
   ```
   cd backend
   ```
3. Utwórz wirtualne środowisko Pythona:
   ```
   python -m venv venv
   ```
4. Aktywuj wirtualne środowisko:
   - Windows:
     ```
     venv\Scripts\activate
     ```
   - Linux/macOS:
     ```
     source venv/bin/activate
     ```
5. Zainstaluj zależności:
   ```
   pip install -r requirements.txt
   ```
6. Utwórz plik `.env` na podstawie `.env.example`:
   ```
   cp .env.example .env
   ```
7. Edytuj plik `.env` i dodaj swój klucz API Alpha Vantage:
   ```
   ALPHA_VANTAGE_API_KEY=twój_klucz_api
   ```

## Uruchamianie

Aby uruchomić aplikację:

```
python -m presentation.app
```

Aplikacja będzie dostępna pod adresem: http://localhost:5000

## Endpointy API

- **GET /api/health** - Sprawdzenie stanu API
- **GET /api/stocks/search?query=...** - Wyszukiwanie instrumentów giełdowych
- **GET /api/stocks/{symbol}** - Pobieranie danych giełdowych dla danego symbolu

  Parametry:
  - `interval` - Interwał danych (daily, weekly, monthly, intraday_1min, intraday_5min, intraday_15min, intraday_30min, intraday_60min)
  - `period` - Okres danych (1d, 5d, 1m, 3m, 6m, 1y, 2y, 5y, max)
  - `startDate` - Data początkowa (YYYY-MM-DD)
  - `endDate` - Data końcowa (YYYY-MM-DD)

## Przykłady użycia

Wyszukiwanie instrumentów giełdowych:
```
GET /api/stocks/search?query=AAPL
```

Pobieranie dziennych danych dla Apple z ostatniego roku:
```
GET /api/stocks/AAPL?interval=daily&period=1y
```

Pobieranie śróddziennych danych dla Microsoft z 5-minutowym interwałem:
```
GET /api/stocks/MSFT?interval=intraday_5min
``` 