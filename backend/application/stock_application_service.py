from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional

from domain.entities.stock_data import StockData, StockMetadata
from domain.services.stock_service import StockService


class StockApplicationService:
    """Usługa aplikacyjna do obsługi operacji związanych z danymi giełdowymi."""
    
    def __init__(self, stock_service: StockService):
        self.stock_service = stock_service
    
    def search_stocks(self, query: str) -> List[Dict[str, Any]]:
        """
        Wyszukuje instrumenty giełdowe na podstawie zapytania.
        
        Args:
            query: Zapytanie wyszukiwania
            
        Returns:
            Lista pasujących instrumentów w formacie JSON
        """
        results = self.stock_service.search_stocks(query)
        return [self._stock_metadata_to_dict(metadata) for metadata in results]
    
    def get_stock_data(self, symbol: str, interval: str = "daily", 
                      period: Optional[str] = None, 
                      start_date: Optional[str] = None,
                      end_date: Optional[str] = None) -> Dict[str, Any]:
        """
        Pobiera dane giełdowe dla określonego symbolu i interwału.
        
        Args:
            symbol: Symbol giełdowy
            interval: Interwał danych ("intraday_1min", "intraday_5min", "intraday_15min", 
                                     "intraday_30min", "intraday_60min", "daily", 
                                     "weekly", "monthly")
            period: Okres danych ("1d", "5d", "1m", "3m", "6m", "1y", "2y", "5y", "max")
            start_date: Data początkowa (format: YYYY-MM-DD)
            end_date: Data końcowa (format: YYYY-MM-DD)
            
        Returns:
            Dane giełdowe w formacie JSON
        """
        print(f"[DEBUG][ApplicationService] get_stock_data - symbol: {symbol}, interval: {interval}, period: {period}, start_date: {start_date}, end_date: {end_date}")
        
        # Mapowanie okresu na daty
        start_datetime = None
        end_datetime = None
        
        if period:
            end_datetime = datetime.now()
            
            if period == "1d":
                start_datetime = end_datetime - timedelta(days=1)
            elif period == "5d":
                start_datetime = end_datetime - timedelta(days=5)
            elif period == "1m":
                start_datetime = end_datetime - timedelta(days=30)
            elif period == "3m":
                start_datetime = end_datetime - timedelta(days=90)
            elif period == "6m":
                start_datetime = end_datetime - timedelta(days=180)
            elif period == "1y":
                start_datetime = end_datetime - timedelta(days=365)
            elif period == "2y":
                start_datetime = end_datetime - timedelta(days=2*365)
            elif period == "5y":
                start_datetime = end_datetime - timedelta(days=5*365)
            # Dla "max" nie ustawiamy daty początkowej
            
            print(f"[DEBUG][ApplicationService] Okres {period} przekształcony na daty: {start_datetime} - {end_datetime}")
        
        # Przekształcenie dat z stringów
        try:
            if start_date and not start_datetime:
                start_datetime = datetime.strptime(start_date, "%Y-%m-%d")
                print(f"[DEBUG][ApplicationService] Przekształcono start_date '{start_date}' na {start_datetime}")
            
            if end_date:
                end_datetime = datetime.strptime(end_date, "%Y-%m-%d")
                print(f"[DEBUG][ApplicationService] Przekształcono end_date '{end_date}' na {end_datetime}")
        except ValueError as e:
            print(f"[ERROR][ApplicationService] Błąd podczas parsowania dat: {str(e)}")
            raise ValueError(f"Nieprawidłowy format daty: {str(e)}")
        
        print(f"[DEBUG][ApplicationService] Pobieranie danych z serwisu domenowego - symbol: {symbol}, interval: {interval}, start_date: {start_datetime}, end_date: {end_datetime}")
        
        try:
            # Pobieranie danych
            stock_data = self.stock_service.get_stock_data(
                symbol, 
                interval=interval, 
                start_date=start_datetime, 
                end_date=end_datetime
            )
            
            result = self._stock_data_to_dict(stock_data)
            print(f"[DEBUG][ApplicationService] Pobrano dane dla {symbol} - liczba punktów: {len(result.get('prices', []))}")
            return result
        except Exception as e:
            import traceback
            print(f"[ERROR][ApplicationService] Błąd podczas pobierania danych dla {symbol}: {str(e)}")
            print(f"[ERROR][ApplicationService] Szczegóły: {traceback.format_exc()}")
            raise
    
    def _stock_metadata_to_dict(self, metadata: StockMetadata) -> Dict[str, Any]:
        """Konwertuje obiekt StockMetadata na słownik."""
        return {
            "symbol": metadata.symbol,
            "name": metadata.name,
            "type": metadata.type,
            "region": metadata.region,
            "currency": metadata.currency,
            "matchScore": metadata.match_score
        }
    
    def _stock_data_to_dict(self, data: StockData) -> Dict[str, Any]:
        """Konwertuje obiekt StockData na słownik."""
        return {
            "symbol": data.symbol,
            "name": data.name,
            "interval": data.interval,
            "lastRefreshed": data.last_refreshed.isoformat(),
            "prices": [
                {
                    "timestamp": price.timestamp.isoformat(),
                    "open": price.open,
                    "high": price.high,
                    "low": price.low,
                    "close": price.close,
                    "volume": price.volume
                }
                for price in data.prices
            ]
        } 