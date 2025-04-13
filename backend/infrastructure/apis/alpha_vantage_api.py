import os
import requests
from datetime import datetime
from typing import Dict, Any, List, Optional

from dotenv import load_dotenv

load_dotenv()


class AlphaVantageAPI:
    """Klasa do komunikacji z API Alpha Vantage."""
    
    BASE_URL = "https://www.alphavantage.co/query"
    
    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or os.getenv("ALPHA_VANTAGE_API_KEY")
        if not self.api_key:
            raise ValueError("Nie podano klucza API Alpha Vantage")
    
    def _make_request(self, params: Dict[str, str]) -> Dict[str, Any]:
        """
        Wykonuje zapytanie do API Alpha Vantage.
        
        Args:
            params: Parametry zapytania
            
        Returns:
            Odpowiedź API jako słownik
            
        Raises:
            Exception: Gdy wystąpi błąd podczas zapytania
        """
        params["apikey"] = self.api_key
        
        response = requests.get(self.BASE_URL, params=params)
        
        if response.status_code != 200:
            raise Exception(f"Błąd API: {response.status_code}")
        
        data = response.json()
        
        if "Error Message" in data:
            raise Exception(f"Błąd API Alpha Vantage: {data['Error Message']}")
        
        if "Information" in data:
            raise Exception(f"Limit zapytań API: {data['Information']}")
        
        if "Note" in data and "API call frequency" in data["Note"]:
            raise Exception(f"Osiągnięto limit API: {data['Note']}")
        
        return data
    
    def search_symbol(self, keywords: str) -> List[Dict[str, Any]]:
        """
        Wyszukuje instrumenty giełdowe na podstawie słów kluczowych.
        
        Args:
            keywords: Słowa kluczowe do wyszukiwania
            
        Returns:
            Lista pasujących instrumentów
        """
        params = {
            "function": "SYMBOL_SEARCH",
            "keywords": keywords
        }
        
        data = self._make_request(params)
        return data.get("bestMatches", [])
    
    def get_daily_data(self, symbol: str, output_size: str = "compact") -> Dict[str, Any]:
        """
        Pobiera dzienne dane dla danego symbolu.
        
        Args:
            symbol: Symbol giełdowy
            output_size: Ilość danych ("compact" - ostatnie 100 dni, "full" - do 20 lat)
            
        Returns:
            Dane dzienne
        """
        params = {
            "function": "TIME_SERIES_DAILY",
            "symbol": symbol,
            "outputsize": output_size
        }
        
        return self._make_request(params)
    
    def get_intraday_data(self, symbol: str, interval: str = "5min", output_size: str = "compact") -> Dict[str, Any]:
        """
        Pobiera dane śróddzienne dla danego symbolu.
        
        Args:
            symbol: Symbol giełdowy
            interval: Interwał danych ("1min", "5min", "15min", "30min", "60min")
            output_size: Ilość danych ("compact" - ostatnie 100 punktów, "full" - do 30 dni)
            
        Returns:
            Dane śróddzienne
        """
        params = {
            "function": "TIME_SERIES_INTRADAY",
            "symbol": symbol,
            "interval": interval,
            "outputsize": output_size
        }
        
        return self._make_request(params)
    
    def get_weekly_data(self, symbol: str) -> Dict[str, Any]:
        """
        Pobiera tygodniowe dane dla danego symbolu.
        
        Args:
            symbol: Symbol giełdowy
            
        Returns:
            Dane tygodniowe
        """
        params = {
            "function": "TIME_SERIES_WEEKLY",
            "symbol": symbol
        }
        
        return self._make_request(params)
    
    def get_monthly_data(self, symbol: str) -> Dict[str, Any]:
        """
        Pobiera miesięczne dane dla danego symbolu.
        
        Args:
            symbol: Symbol giełdowy
            
        Returns:
            Dane miesięczne
        """
        params = {
            "function": "TIME_SERIES_MONTHLY",
            "symbol": symbol
        }
        
        return self._make_request(params) 