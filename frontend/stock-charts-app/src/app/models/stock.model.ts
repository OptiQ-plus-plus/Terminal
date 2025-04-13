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

export interface OptionContract {
  symbol: string;
  underlyingSymbol: string;
  expirationDate: string;
  strikePrice: number;
  optionType: 'call' | 'put';
  lastPrice: number;
  bid: number;
  ask: number;
  change: number;
  percentChange: number;
  volume: number;
  openInterest: number;
  impliedVolatility: number;
  inTheMoney: boolean;
  lastTradeDate: string;
}

export interface OptionGreeks {
  delta: number;
  gamma: number;
  theta: number;
  vega: number;
  rho: number;
}

export interface OptionWithGreeks extends OptionContract {
  greeks: OptionGreeks;
}

export interface PredictionModel {
  id: string;
  name: string;
  description: string;
  targetSymbol: string;
  predictionHorizon: number; // w dniach
  confidence: number;
  createdAt: string;
  lastUpdated: string;
}

export interface ProbabilityDistribution {
  expectedValue: number;
  variance: number;
  skewness: number;
  kurtosis: number;
  confidenceIntervals: {
    lowerBound: number;
    upperBound: number;
    confidence: number;
  }[];
  discretePoints: {
    value: number;
    probability: number;
  }[];
}

export interface OptimizationParameters {
  riskAttitude: number; // 0 = neutralny, <0 = awersja do ryzyka, >0 = skłonność do ryzyka
  timeDiscounting: number; // współczynnik dyskontowania w czasie
  constraints: Record<string, any>; // dodatkowe ograniczenia
}

export interface QumoMatrix {
  dimensions: number;
  matrix: number[][];
  eigenvalues?: number[];
  resultVector?: number[];
}

export interface ApiSettings {
  providers: {
    name: string;
    baseUrl: string;
    apiKey: string;
    rateLimit: number;
    enabled: boolean;
  }[];
  quantumComputerEndpoint?: string;
} 