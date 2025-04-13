export interface StockMetadata {
  symbol: string;
  name: string;
  type: string;
  region: string;
  currency: string;
  matchScore?: number;
}

export interface StockPrice {
  timestamp: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface StockData {
  symbol: string;
  name?: string;
  interval: string;
  lastRefreshed: string;
  prices: StockPrice[];
}

export interface ApiResponse<T> {
  status: string;
  data?: T;
  message?: string;
} 