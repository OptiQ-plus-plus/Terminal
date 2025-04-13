import os
import requests
import logging
import json
from datetime import datetime
from typing import Dict, Any, List, Optional

from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)

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
        request_params = params.copy()
        request_params["apikey"] = self.api_key
        
        # Zapisujemy kopię parametrów bez API key do logów
        log_params = params.copy()
        logger.debug(f"Wykonywanie zapytania do Alpha Vantage API: {log_params}")
        
        try:
            response = requests.get(self.BASE_URL, params=request_params)
            
            logger.debug(f"Otrzymano odpowiedź z kodem: {response.status_code}")
            
            if response.status_code != 200:
                logger.error(f"Błąd Alpha Vantage API: kod {response.status_code}, treść: {response.text}")
                raise Exception(f"Błąd API: {response.status_code}")
            
            data = response.json()
            
            # Sprawdzamy różne rodzaje błędów
            if "Error Message" in data:
                logger.error(f"Błąd Alpha Vantage API dla {log_params}: {data['Error Message']}")
                raise Exception(f"Błąd API Alpha Vantage: {data['Error Message']}")
            
            if "Information" in data:
                logger.error(f"Limit zapytań Alpha Vantage API dla {log_params}: {data['Information']}")
                raise Exception(f"Limit zapytań API: {data['Information']}")
            
            if "Note" in data and "API call frequency" in data["Note"]:
                logger.error(f"Osiągnięto limit Alpha Vantage API dla {log_params}: {data['Note']}")
                raise Exception(f"Osiągnięto limit API: {data['Note']}")
            
            # Logujemy klucze w odpowiedzi aby pomóc w debugowaniu
            logger.debug(f"Otrzymano odpowiedź z kluczami: {list(data.keys())}")
            
            return data
        except requests.exceptions.RequestException as e:
            logger.error(f"Błąd połączenia z Alpha Vantage API: {str(e)}")
            raise Exception(f"Błąd połączenia z API: {str(e)}")
        except json.JSONDecodeError as e:
            logger.error(f"Nie można zdekodować odpowiedzi JSON: {str(e)}")
            raise Exception(f"Nieprawidłowa odpowiedź API: {str(e)}")
        except Exception as e:
            logger.error(f"Nieznany błąd podczas zapytania do Alpha Vantage API: {str(e)}")
            raise
    
    def search_symbol(self, keywords: str) -> List[Dict[str, Any]]:
        """
        Wyszukuje symbole giełdowe na podstawie słów kluczowych.
        
        Args:
            keywords: Słowa kluczowe do wyszukania
            
        Returns:
            Lista znalezionych dopasowań
        """
        logger.debug(f"Wyszukiwanie symbolu dla słów kluczowych: {keywords}")
        params = {
            "function": "SYMBOL_SEARCH",
            "keywords": keywords
        }
        
        try:
            data = self._make_request(params)
            matches = data.get("bestMatches", [])
            logger.debug(f"Znaleziono {len(matches)} dopasowań dla wyszukiwania: {keywords}")
            return matches
        except Exception as e:
            logger.error(f"Błąd podczas wyszukiwania symbolu dla {keywords}: {str(e)}")
            raise
    
    def get_daily_data(self, symbol: str, output_size: str = "compact") -> Dict[str, Any]:
        """
        Pobiera dzienne dane dla danego symbolu.
        
        Args:
            symbol: Symbol giełdowy
            output_size: Ilość danych ("compact" - ostatnie 100 dni, "full" - do 20 lat)
            
        Returns:
            Dane dzienne
        """
        logger.debug(f"Pobieranie dziennych danych dla symbolu: {symbol}, output_size: {output_size}")
        params = {
            "function": "TIME_SERIES_DAILY",
            "symbol": symbol,
            "outputsize": output_size
        }
        
        try:
            data = self._make_request(params)
            logger.debug(f"Pobrano dzienne dane dla {symbol}, klucze w odpowiedzi: {list(data.keys())}")
            return data
        except Exception as e:
            logger.error(f"Błąd podczas pobierania dziennych danych dla {symbol}: {str(e)}")
            raise
    
    def get_intraday_data(self, symbol: str, interval: str = "5min", output_size: str = "compact") -> Dict[str, Any]:
        """
        Pobiera dane wewnątrzdzienne dla danego symbolu.
        
        Args:
            symbol: Symbol giełdowy
            interval: Interwał czasowy ("1min", "5min", "15min", "30min", "60min")
            output_size: Ilość danych ("compact" - ostatnie 100 przedziałów, "full" - do 30 dni)
            
        Returns:
            Dane wewnątrzdzienne
        """
        logger.debug(f"Pobieranie danych wewnątrzdziennych dla symbolu: {symbol}, interval: {interval}, output_size: {output_size}")
        params = {
            "function": "TIME_SERIES_INTRADAY",
            "symbol": symbol,
            "interval": interval,
            "outputsize": output_size
        }
        
        try:
            data = self._make_request(params)
            logger.debug(f"Pobrano dane wewnątrzdzienne dla {symbol}, klucze w odpowiedzi: {list(data.keys())}")
            return data
        except Exception as e:
            logger.error(f"Błąd podczas pobierania danych wewnątrzdziennych dla {symbol}: {str(e)}")
            raise
    
    def get_weekly_data(self, symbol: str) -> Dict[str, Any]:
        """
        Pobiera tygodniowe dane dla danego symbolu.
        
        Args:
            symbol: Symbol giełdowy
            
        Returns:
            Dane tygodniowe
        """
        logger.debug(f"Pobieranie tygodniowych danych dla symbolu: {symbol}")
        params = {
            "function": "TIME_SERIES_WEEKLY",
            "symbol": symbol
        }
        
        try:
            data = self._make_request(params)
            logger.debug(f"Pobrano dane tygodniowe dla {symbol}, klucze w odpowiedzi: {list(data.keys())}")
            return data
        except Exception as e:
            logger.error(f"Błąd podczas pobierania danych tygodniowych dla {symbol}: {str(e)}")
            raise
    
    def get_monthly_data(self, symbol: str) -> Dict[str, Any]:
        """
        Pobiera miesięczne dane dla danego symbolu.
        
        Args:
            symbol: Symbol giełdowy
            
        Returns:
            Dane miesięczne
        """
        logger.debug(f"Pobieranie miesięcznych danych dla symbolu: {symbol}")
        params = {
            "function": "TIME_SERIES_MONTHLY",
            "symbol": symbol
        }
        
        try:
            data = self._make_request(params)
            logger.debug(f"Pobrano dane miesięczne dla {symbol}, klucze w odpowiedzi: {list(data.keys())}")
            return data
        except Exception as e:
            logger.error(f"Błąd podczas pobierania danych miesięcznych dla {symbol}: {str(e)}")
            raise 