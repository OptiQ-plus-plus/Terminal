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
        if interval == "daily":
            return self.repository.get_daily_data(symbol, start_date, end_date)
        elif interval == "weekly":
            return self.repository.get_weekly_data(symbol)
        elif interval == "monthly":
            return self.repository.get_monthly_data(symbol)
        elif interval.startswith("intraday"):
            # format: intraday_1min, intraday_5min, intraday_15min, intraday_30min, intraday_60min
            intraday_interval = interval.split("_")[1] if "_" in interval else "5min"
            return self.repository.get_intraday_data(symbol, intraday_interval)
        else:
            raise ValueError(f"Nieobsługiwany interwał: {interval}") 