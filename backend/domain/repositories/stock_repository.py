from abc import ABC, abstractmethod
from typing import List, Optional
from datetime import datetime

from domain.entities.stock_data import StockData, StockMetadata


class StockRepository(ABC):
    """Interfejs repozytorium dla danych giełdowych."""
    
    @abstractmethod
    def search_stocks(self, query: str) -> List[StockMetadata]:
        """Wyszukuje instrumenty giełdowe na podstawie zapytania."""
        pass
    
    @abstractmethod
    def get_daily_data(self, symbol: str, start_date: Optional[datetime] = None, 
                      end_date: Optional[datetime] = None) -> StockData:
        """Pobiera dzienne dane historyczne dla danego symbolu."""
        pass
    
    @abstractmethod
    def get_intraday_data(self, symbol: str, interval: str) -> StockData:
        """Pobiera dane śróddzienne dla danego symbolu z określonym interwałem."""
        pass
    
    @abstractmethod
    def get_weekly_data(self, symbol: str) -> StockData:
        """Pobiera tygodniowe dane dla danego symbolu."""
        pass
    
    @abstractmethod
    def get_monthly_data(self, symbol: str) -> StockData:
        """Pobiera miesięczne dane dla danego symbolu."""
        pass 