from datetime import datetime
from typing import List, Dict, Any, Optional
from pydantic import BaseModel


class StockPrice(BaseModel):
    """Reprezentuje pojedynczy punkt danych cenowych dla akcji."""
    timestamp: datetime
    open: float
    high: float
    low: float
    close: float
    volume: int


class StockData(BaseModel):
    """Reprezentuje zbiór danych cenowych dla konkretnego symbolu giełdowego."""
    symbol: str
    name: Optional[str] = None
    prices: List[StockPrice]
    interval: str  # np. "daily", "weekly", "intraday"
    last_refreshed: datetime


class StockMetadata(BaseModel):
    """Informacje o instrumencie giełdowym."""
    symbol: str
    name: str
    type: str  # np. "Equity", "ETF", "Index"
    region: str
    currency: str
    match_score: Optional[float] = None 