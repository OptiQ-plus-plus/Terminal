from typing import List, Optional
from datetime import datetime

from domain.entities.stock_data import StockData, StockMetadata
from domain.repositories.stock_repository import StockRepository


class StockService:
    """Usługa domenowa do obsługi danych giełdowych."""
    
    def __init__(self, stock_repository: StockRepository):
        self.repository = stock_repository
    
    def search_stocks(self, query: str) -> List[StockMetadata]:
        """Wyszukuje instrumenty giełdowe na podstawie zapytania."""
        return self.repository.search_stocks(query)
    
    def get_stock_data(self, symbol: str, interval: str = "daily", 
                      start_date: Optional[datetime] = None,
                      end_date: Optional[datetime] = None) -> StockData:
        """
        Pobiera dane giełdowe dla określonego symbolu i interwału.
        
        Args:
            symbol: Symbol giełdowy
            interval: Interwał danych ("intraday", "daily", "weekly", "monthly")
            start_date: Data początkowa (tylko dla daily)
            end_date: Data końcowa (tylko dla daily)
        
        Returns:
            Dane giełdowe
        """
        print(f"[DEBUG][DomainService] get_stock_data - symbol: {symbol}, interval: {interval}, start_date: {start_date}, end_date: {end_date}")
        
        try:
            if interval == "daily":
                print(f"[DEBUG][DomainService] Pobieranie danych dziennych dla {symbol}")
                data = self.repository.get_daily_data(symbol, start_date, end_date)
            elif interval == "weekly":
                print(f"[DEBUG][DomainService] Pobieranie danych tygodniowych dla {symbol}")
                data = self.repository.get_weekly_data(symbol)
            elif interval == "monthly":
                print(f"[DEBUG][DomainService] Pobieranie danych miesięcznych dla {symbol}")
                data = self.repository.get_monthly_data(symbol)
            elif interval.startswith("intraday"):
                # format: intraday_1min, intraday_5min, intraday_15min, intraday_30min, intraday_60min
                intraday_interval = interval.split("_")[1] if "_" in interval else "5min"
                print(f"[DEBUG][DomainService] Pobieranie danych intraday ({intraday_interval}) dla {symbol}")
                data = self.repository.get_intraday_data(symbol, intraday_interval)
            else:
                error_msg = f"Nieobsługiwany interwał: {interval}"
                print(f"[ERROR][DomainService] {error_msg}")
                raise ValueError(error_msg)
            
            if data:
                print(f"[DEBUG][DomainService] Pobrano dane dla {symbol} - punktów: {len(data.prices)}, ostatnie odświeżenie: {data.last_refreshed}")
            else:
                print(f"[WARNING][DomainService] Nie pobrano danych dla {symbol} - null response")
            
            return data
        except Exception as e:
            import traceback
            print(f"[ERROR][DomainService] Błąd podczas pobierania danych dla {symbol}: {str(e)}")
            print(f"[ERROR][DomainService] Szczegóły: {traceback.format_exc()}")
            raise 