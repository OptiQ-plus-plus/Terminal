from datetime import datetime
from typing import List, Optional, Dict, Any
import re

from domain.entities.stock_data import StockData, StockPrice, StockMetadata
from domain.repositories.stock_repository import StockRepository
from infrastructure.apis.alpha_vantage_api import AlphaVantageAPI


class AlphaVantageRepository(StockRepository):
    """Implementacja repozytorium danych giełdowych korzystająca z API Alpha Vantage."""
    
    def __init__(self, api: AlphaVantageAPI):
        self.api = api
    
    def _parse_timestamp(self, timestamp_str: str) -> datetime:
        """Parsuje string czasowy z API na obiekt datetime."""
        if len(timestamp_str) <= 10:  # Format daty: YYYY-MM-DD
            return datetime.strptime(timestamp_str, "%Y-%m-%d")
        else:  # Format daty i czasu: YYYY-MM-DD HH:MM:SS
            return datetime.strptime(timestamp_str, "%Y-%m-%d %H:%M:%S")
    
    def _map_stock_price(self, timestamp_str: str, price_data: Dict[str, str]) -> StockPrice:
        """Mapuje dane cenowe z API na obiekt StockPrice."""
        return StockPrice(
            timestamp=self._parse_timestamp(timestamp_str),
            open=float(price_data.get("1. open", 0)),
            high=float(price_data.get("2. high", 0)),
            low=float(price_data.get("3. low", 0)),
            close=float(price_data.get("4. close", 0)),
            volume=int(price_data.get("5. volume", 0))
        )
    
    def _extract_metadata(self, data: Dict[str, Any], interval: str) -> Dict[str, Any]:
        """Wyciąga metadane z odpowiedzi API."""
        print(f"[DEBUG][Repository] Ekstrakcja metadanych dla interwału {interval}")
        print(f"[DEBUG][Repository] Klucze w odpowiedzi API: {list(data.keys())}")
        
        metadata_key = next((k for k in data.keys() if "Meta Data" in k or k.startswith("Meta")), None)
        if not metadata_key:
            error_msg = "Brak metadanych w odpowiedzi API"
            print(f"[ERROR][Repository] {error_msg}. Dostępne klucze: {list(data.keys())}")
            raise ValueError(error_msg)
            
        metadata = data[metadata_key]
        print(f"[DEBUG][Repository] Klucze metadanych: {list(metadata.keys())}")
        
        # Klucze metadanych mogą się różnić w zależności od API
        symbol_key = next((k for k in metadata.keys() if "Symbol" in k or "symbol" in k), "1. Symbol")
        last_refreshed_key = next((k for k in metadata.keys() if "Last Refreshed" in k), "3. Last Refreshed")
        
        symbol = metadata.get(symbol_key, "")
        last_refreshed_str = metadata.get(last_refreshed_key, "")
        
        print(f"[DEBUG][Repository] Metadane - symbol: {symbol}, last_refreshed: {last_refreshed_str}")
        
        try:
            last_refreshed = self._parse_timestamp(last_refreshed_str)
        except Exception as e:
            print(f"[ERROR][Repository] Błąd parsowania daty '{last_refreshed_str}': {str(e)}")
            # Fallback do aktualnej daty jeśli nie można sparsować
            last_refreshed = datetime.now()
        
        return {
            "symbol": symbol,
            "last_refreshed": last_refreshed
        }
    
    def _extract_time_series(self, data: Dict[str, Any]) -> Dict[str, Dict[str, Any]]:
        """Wyciąga szereg czasowy z odpowiedzi API."""
        print(f"[DEBUG][Repository] Ekstrakcja szeregu czasowego")
        print(f"[DEBUG][Repository] Klucze w odpowiedzi API: {list(data.keys())}")
        
        time_series_key = next((k for k in data.keys() if "Time Series" in k), None)
        if not time_series_key:
            error_msg = "Brak szeregu czasowego w odpowiedzi API"
            print(f"[ERROR][Repository] {error_msg}. Dostępne klucze: {list(data.keys())}")
            if 'Error Message' in data:
                print(f"[ERROR][Repository] Alpha Vantage Error: {data['Error Message']}")
            if 'Information' in data:
                print(f"[ERROR][Repository] Alpha Vantage Information: {data['Information']}")
            raise ValueError(error_msg)
            
        return data[time_series_key]
    
    def search_stocks(self, query: str) -> List[StockMetadata]:
        """Wyszukuje instrumenty giełdowe na podstawie zapytania."""
        results = self.api.search_symbol(query)
        
        return [
            StockMetadata(
                symbol=item.get("1. symbol", ""),
                name=item.get("2. name", ""),
                type=item.get("3. type", ""),
                region=item.get("4. region", ""),
                currency=item.get("8. currency", ""),
                match_score=float(item.get("9. matchScore", 0))
            )
            for item in results
        ]
    
    def get_daily_data(self, symbol: str, start_date: Optional[datetime] = None, 
                      end_date: Optional[datetime] = None) -> StockData:
        """Pobiera dzienne dane historyczne dla danego symbolu."""
        print(f"[DEBUG][Repository] Pobieranie danych dziennych - symbol: {symbol}, start_date: {start_date}, end_date: {end_date}")
        
        # Pobieramy pełne dane, jeśli podano daty
        output_size = "full" if start_date or end_date else "compact"
        print(f"[DEBUG][Repository] Używam output_size: {output_size}")
        
        try:
            data = self.api.get_daily_data(symbol, output_size)
            print(f"[DEBUG][Repository] Otrzymano odpowiedź z API dla {symbol}")
            
            if not data:
                print(f"[ERROR][Repository] Pusta odpowiedź z API dla {symbol}")
                raise ValueError(f"Pusta odpowiedź z API dla symbolu {symbol}")
            
            # Sprawdź, czy mamy komunikat o błędzie od Alpha Vantage
            if 'Error Message' in data:
                error_msg = data['Error Message']
                print(f"[ERROR][Repository] Alpha Vantage zwrócił błąd: {error_msg}")
                raise ValueError(f"Alpha Vantage error: {error_msg}")
            
            if 'Information' in data:
                info_msg = data['Information']
                print(f"[WARNING][Repository] Alpha Vantage zwrócił informację: {info_msg}")
                if 'API call frequency' in info_msg:
                    raise ValueError(f"Przekroczono limit zapytań do Alpha Vantage: {info_msg}")
            
            try:
                metadata = self._extract_metadata(data, "daily")
            except Exception as e:
                print(f"[ERROR][Repository] Błąd podczas ekstakcji metadanych: {str(e)}")
                import traceback
                print(f"[ERROR][Repository] Traceback: {traceback.format_exc()}")
                raise
            
            try:
                time_series = self._extract_time_series(data)
                print(f"[DEBUG][Repository] Liczba punktów w szeregu czasowym: {len(time_series)}")
            except Exception as e:
                print(f"[ERROR][Repository] Błąd podczas ekstakcji szeregu czasowego: {str(e)}")
                print(f"[DEBUG][Repository] Zawartość odpowiedzi API: {data}")
                import traceback
                print(f"[ERROR][Repository] Traceback: {traceback.format_exc()}")
                raise
            
            # Filtrowanie po datach, jeśli podano
            filtered_count = 0
            if start_date or end_date:
                filtered_series = {}
                for date_str, price_data in time_series.items():
                    try:
                        date = self._parse_timestamp(date_str)
                        if (not start_date or date >= start_date) and (not end_date or date <= end_date):
                            filtered_series[date_str] = price_data
                            filtered_count += 1
                    except Exception as e:
                        print(f"[WARNING][Repository] Błąd parsowania daty '{date_str}': {str(e)}")
                        continue
                
                time_series = filtered_series
                print(f"[DEBUG][Repository] Po filtrowaniu zostało {filtered_count} punktów danych")
            
            prices = []
            for timestamp_str, price_data in time_series.items():
                try:
                    price = self._map_stock_price(timestamp_str, price_data)
                    prices.append(price)
                except Exception as e:
                    print(f"[WARNING][Repository] Błąd mapowania ceny dla '{timestamp_str}': {str(e)}")
                    continue
            
            print(f"[DEBUG][Repository] Zmapowano {len(prices)} punktów cenowych")
            
            # Sortowanie cen po czasie (od najnowszych do najstarszych)
            prices.sort(key=lambda x: x.timestamp, reverse=True)
            
            result = StockData(
                symbol=metadata["symbol"],
                prices=prices,
                interval="daily",
                last_refreshed=metadata["last_refreshed"]
            )
            
            print(f"[DEBUG][Repository] Zwracam dane dla {symbol} - liczba punktów: {len(result.prices)}")
            return result
        except Exception as e:
            print(f"[ERROR][Repository] Błąd podczas pobierania danych dziennych dla {symbol}: {str(e)}")
            import traceback
            print(f"[ERROR][Repository] Traceback: {traceback.format_exc()}")
            raise
    
    def get_intraday_data(self, symbol: str, interval: str) -> StockData:
        """Pobiera dane śróddzienne dla danego symbolu z określonym interwałem."""
        # Sprawdzenie poprawności interwału
        if not re.match(r"^\d+min$", interval):
            raise ValueError(f"Nieprawidłowy interwał: {interval}")
            
        data = self.api.get_intraday_data(symbol, interval)
        
        metadata = self._extract_metadata(data, f"intraday_{interval}")
        time_series = self._extract_time_series(data)
        
        prices = [
            self._map_stock_price(timestamp_str, price_data)
            for timestamp_str, price_data in time_series.items()
        ]
        
        # Sortowanie cen po czasie (od najnowszych do najstarszych)
        prices.sort(key=lambda x: x.timestamp, reverse=True)
        
        return StockData(
            symbol=metadata["symbol"],
            prices=prices,
            interval=f"intraday_{interval}",
            last_refreshed=metadata["last_refreshed"]
        )
    
    def get_weekly_data(self, symbol: str) -> StockData:
        """Pobiera tygodniowe dane dla danego symbolu."""
        data = self.api.get_weekly_data(symbol)
        
        metadata = self._extract_metadata(data, "weekly")
        time_series = self._extract_time_series(data)
        
        prices = [
            self._map_stock_price(timestamp_str, price_data)
            for timestamp_str, price_data in time_series.items()
        ]
        
        # Sortowanie cen po czasie (od najnowszych do najstarszych)
        prices.sort(key=lambda x: x.timestamp, reverse=True)
        
        return StockData(
            symbol=metadata["symbol"],
            prices=prices,
            interval="weekly",
            last_refreshed=metadata["last_refreshed"]
        )
    
    def get_monthly_data(self, symbol: str) -> StockData:
        """Pobiera miesięczne dane dla danego symbolu."""
        data = self.api.get_monthly_data(symbol)
        
        metadata = self._extract_metadata(data, "monthly")
        time_series = self._extract_time_series(data)
        
        prices = [
            self._map_stock_price(timestamp_str, price_data)
            for timestamp_str, price_data in time_series.items()
        ]
        
        # Sortowanie cen po czasie (od najnowszych do najstarszych)
        prices.sort(key=lambda x: x.timestamp, reverse=True)
        
        return StockData(
            symbol=metadata["symbol"],
            prices=prices,
            interval="monthly",
            last_refreshed=metadata["last_refreshed"]
        ) 