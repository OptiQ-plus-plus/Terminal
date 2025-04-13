# Aplikacja do Wykresów Giełdowych

Aplikacja do wyświetlania wykresów giełdowych z wykorzystaniem danych z API Alpha Vantage, zbudowana zgodnie z zasadami Domain-Driven Design (DDD). Projekt składa się z backendu w Python/Flask i frontendu w Angular.

## Struktura projektu

Aplikacja składa się z dwóch głównych części:

### Backend (Python/Flask)

Backend zbudowany jest w architekturze heksagonalnej zgodnej z DDD:

- **Domain** - zawiera encje, repozytoria i usługi domenowe
- **Application** - warstwa aplikacyjna (przypadki użycia)
- **Infrastructure** - implementacja infrastruktury (API Alpha Vantage, repozytoria)
- **Presentation** - interfejs użytkownika (API REST)

### Frontend (Angular)

Frontend zbudowany w Angularze umożliwiający:

- Wyszukiwanie instrumentów giełdowych
- Wyświetlanie wykresów w różnych formatach (świece, linie, OHLC)
- Wybór interwałów czasowych i okresów wyświetlanych danych

## Funkcjonalności

- Wyszukiwanie instrumentów giełdowych
- Pobieranie danych historycznych z różnymi interwałami (śróddzienne, dzienne, tygodniowe, miesięczne)
- Wizualizacja danych w postaci wykresów
- Tabela z ostatnimi danymi cenowymi

## Uruchamianie w Dockerze

Aplikacja jest skonfigurowana do uruchamiania w środowisku Docker, co zapewnia łatwą instalację i konfigurację.

### Skrypty Docker

W projekcie dostępne są następujące skrypty do zarządzania kontenerami Docker:

1. **start-docker.sh** - Buduje i uruchamia aplikację w kontenerach Docker
   ```bash
   ./start-docker.sh
   ```

2. **stop-docker.sh** - Zatrzymuje i usuwa kontenery aplikacji
   ```bash
   ./stop-docker.sh
   ```

3. **clean-docker.sh** - Całkowicie czyści zasoby Docker związane z aplikacją (kontenery, obrazy, woluminy)
   ```bash
   ./clean-docker.sh
   ```

Po uruchomieniu, aplikacja będzie dostępna pod adresami:
- Frontend: http://localhost:4200
- Backend API: http://localhost:5000/api

## Tradycyjna instalacja (bez Dockera)

### Backend

Szczegółowe instrukcje znajdują się w katalogu [backend/README.md](backend/README.md).

Skrócona wersja:

```bash
cd backend
python -m venv venv
source venv/bin/activate  # Linux/macOS
venv\Scripts\activate     # Windows
pip install -r requirements.txt
cp .env.example .env
# Edytuj plik .env dodając swój klucz API Alpha Vantage
python -m presentation.app
```

### Frontend

Szczegółowe instrukcje znajdują się w katalogu [frontend/README.md](frontend/README.md).

Skrócona wersja:

```bash
cd frontend/stock-charts-app
npm install
npm install highcharts highcharts-angular @fortawesome/fontawesome-free
ng serve
```

## Architektura

Aplikacja została zaprojektowana zgodnie z zasadami Domain-Driven Design (DDD), co pozwala na:

- Wyraźne oddzielenie domeny biznesowej od szczegółów technicznych
- Łatwą rozszerzalność i modyfikację
- Lepszą testowalność
- Czytelność i zrozumiałość kodu

### Diagram architektury

```
┌───────────────────────────────┐      ┌────────────────────────────┐
│            Frontend           │      │           Backend          │
│                               │      │                            │
│  ┌─────────────────────────┐  │      │  ┌──────────────────────┐  │
│  │      Komponenty UI      │  │      │  │  Warstwa prezentacji │  │
│  └─────────────────────────┘  │      │  └──────────────────────┘  │
│              │                │      │              │             │
│              ▼                │      │              ▼             │
│  ┌─────────────────────────┐  │      │  ┌──────────────────────┐  │
│  │        Usługi           │──┼──────┼─▶│  Warstwa aplikacji   │  │
│  └─────────────────────────┘  │      │  └──────────────────────┘  │
│                               │      │              │             │
│                               │      │              ▼             │
│                               │      │  ┌──────────────────────┐  │
│                               │      │  │    Warstwa domeny    │  │
│                               │      │  └──────────────────────┘  │
│                               │      │              │             │
│                               │      │              ▼             │
│                               │      │  ┌──────────────────────┐  │
│                               │      │  │Warstwa infrastruktury│  │
│                               │      │  └──────────────────────┘  │
│                               │      │              │             │
└───────────────────────────────┘      └──────────────┼────────────┘
                                                      │
                                                      ▼
                                       ┌──────────────────────────┐
                                       │     API Alpha Vantage    │
                                       └──────────────────────────┘
```

## Licencja

MIT 