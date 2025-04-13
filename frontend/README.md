# Frontend Aplikacji do Wykresów Giełdowych

Frontend aplikacji do wyświetlania wykresów giełdowych z wykorzystaniem frameworka Angular. Aplikacja umożliwia wyszukiwanie i wizualizację danych giełdowych pobieranych z API Alpha Vantage.

## Funkcjonalności

- Wyszukiwanie instrumentów giełdowych
- Wyświetlanie wykresów giełdowych w różnych formatach (świece, linie, OHLC)
- Wybór różnych interwałów czasowych (śróddzienne, dzienne, tygodniowe, miesięczne)
- Wybór okresu danych (5 dni, 1 miesiąc, 3 miesiące, 6 miesięcy, 1 rok, 2 lata, 5 lat, maksimum)
- Wyświetlanie tabeli z ostatnimi danymi cenowymi

## Wymagania

- Node.js 14+
- npm 6+
- Angular CLI

## Instalacja

1. Sklonuj to repozytorium
2. Przejdź do katalogu frontendu:
   ```
   cd frontend/stock-charts-app
   ```
3. Zainstaluj zależności:
   ```
   npm install
   ```
4. Zainstaluj dodatkowe pakiety:
   ```
   npm install highcharts highcharts-angular @fortawesome/fontawesome-free
   ```

## Uruchamianie

### Tryb deweloperski

```
ng serve
```

Aplikacja będzie dostępna pod adresem: http://localhost:4200

### Budowanie wersji produkcyjnej

```
ng build --prod
```

Pliki produkcyjne zostaną wygenerowane w katalogu `dist/`.

## Struktura projektu

- `src/app/components/` - Komponenty aplikacji
  - `stock-search/` - Komponent wyszukiwarki instrumentów giełdowych
  - `stock-chart/` - Komponent wykresów giełdowych
  - `stock-details/` - Komponent szczegółów instrumentu

- `src/app/services/` - Usługi aplikacji
  - `stock.service.ts` - Usługa do komunikacji z API backendu

- `src/app/models/` - Modele danych
  - `stock.model.ts` - Modele danych dla instrumentów giełdowych

## Komunikacja z backendem

Frontend komunikuje się z backendem przez API RESTowe. Główne endpointy to:

- `GET /api/stocks/search?query=...` - Wyszukiwanie instrumentów giełdowych
- `GET /api/stocks/{symbol}` - Pobieranie danych giełdowych dla określonego symbolu 