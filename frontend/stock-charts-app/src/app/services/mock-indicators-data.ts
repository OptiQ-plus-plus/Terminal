import { StockPrice } from '../models/stock.model';

export interface TechnicalIndicatorData {
  timestamp: string;
  value: number;
  additionalValues?: { [key: string]: number };
}

// Funkcja do obliczania SMA (Simple Moving Average)
export function calculateSMA(prices: StockPrice[], period: number): TechnicalIndicatorData[] {
  const result: TechnicalIndicatorData[] = [];
  
  if (prices.length < period) {
    return result;
  }
  
  for (let i = period - 1; i < prices.length; i++) {
    let sum = 0;
    for (let j = 0; j < period; j++) {
      sum += prices[i - j].close;
    }
    
    result.push({
      timestamp: prices[i].timestamp,
      value: parseFloat((sum / period).toFixed(2))
    });
  }
  
  return result;
}

// Funkcja do obliczania EMA (Exponential Moving Average)
export function calculateEMA(prices: StockPrice[], period: number): TechnicalIndicatorData[] {
  const result: TechnicalIndicatorData[] = [];
  
  if (prices.length < period) {
    return result;
  }
  
  // Oblicz pierwszy EMA jako SMA
  let sum = 0;
  for (let i = 0; i < period; i++) {
    sum += prices[i].close;
  }
  
  let prevEMA = sum / period;
  result.push({
    timestamp: prices[period - 1].timestamp,
    value: parseFloat(prevEMA.toFixed(2))
  });
  
  // Mnożnik dla EMA
  const multiplier = 2 / (period + 1);
  
  // Oblicz pozostałe EMA
  for (let i = period; i < prices.length; i++) {
    const ema = (prices[i].close - prevEMA) * multiplier + prevEMA;
    prevEMA = ema;
    
    result.push({
      timestamp: prices[i].timestamp,
      value: parseFloat(ema.toFixed(2))
    });
  }
  
  return result;
}

// Funkcja do obliczania RSI (Relative Strength Index)
export function calculateRSI(prices: StockPrice[], period: number = 14): TechnicalIndicatorData[] {
  const result: TechnicalIndicatorData[] = [];
  
  if (prices.length <= period) {
    return result;
  }
  
  const gains: number[] = [];
  const losses: number[] = [];
  
  // Oblicz początkowe zmiany cen
  for (let i = 1; i <= period; i++) {
    const change = prices[i].close - prices[i - 1].close;
    gains.push(Math.max(0, change));
    losses.push(Math.max(0, -change));
  }
  
  // Oblicz początkowe średnie
  let avgGain = gains.reduce((a, b) => a + b, 0) / period;
  let avgLoss = losses.reduce((a, b) => a + b, 0) / period;
  
  // Dodaj pierwszy RSI
  let rs = avgGain / (avgLoss === 0 ? 0.001 : avgLoss); // Unikaj dzielenia przez zero
  let rsi = 100 - (100 / (1 + rs));
  
  result.push({
    timestamp: prices[period].timestamp,
    value: parseFloat(rsi.toFixed(2))
  });
  
  // Oblicz pozostałe RSI
  for (let i = period + 1; i < prices.length; i++) {
    const change = prices[i].close - prices[i - 1].close;
    const gain = Math.max(0, change);
    const loss = Math.max(0, -change);
    
    // Używamy wygładzonego RSI (Wilder's smoothing)
    avgGain = ((avgGain * (period - 1)) + gain) / period;
    avgLoss = ((avgLoss * (period - 1)) + loss) / period;
    
    rs = avgGain / (avgLoss === 0 ? 0.001 : avgLoss);
    rsi = 100 - (100 / (1 + rs));
    
    result.push({
      timestamp: prices[i].timestamp,
      value: parseFloat(rsi.toFixed(2))
    });
  }
  
  return result;
}

// Funkcja do obliczania MACD (Moving Average Convergence Divergence)
export function calculateMACD(
  prices: StockPrice[],
  fastPeriod: number = 12,
  slowPeriod: number = 26,
  signalPeriod: number = 9
): TechnicalIndicatorData[] {
  const result: TechnicalIndicatorData[] = [];
  
  // Oblicz EMA dla szybkiego i wolnego okresu
  const fastEMA = calculateEMA(prices, fastPeriod);
  const slowEMA = calculateEMA(prices, slowPeriod);
  
  // Upewnij się, że mamy wystarczająco danych
  if (fastEMA.length === 0 || slowEMA.length === 0) {
    return result;
  }
  
  // Znajdź pierwszy wspólny indeks
  let startIndex = 0;
  while (startIndex < fastEMA.length && 
         fastEMA[startIndex].timestamp !== slowEMA[0].timestamp) {
    startIndex++;
  }
  
  if (startIndex >= fastEMA.length) {
    return result;
  }
  
  // Oblicz linie MACD (różnicę między szybkim i wolnym EMA)
  const macdLine: { timestamp: string; value: number }[] = [];
  
  for (let i = 0, j = startIndex; i < slowEMA.length && j < fastEMA.length; i++, j++) {
    macdLine.push({
      timestamp: slowEMA[i].timestamp,
      value: fastEMA[j].value - slowEMA[i].value
    });
  }
  
  // Oblicz linię sygnału (EMA z linii MACD)
  if (macdLine.length < signalPeriod) {
    return result;
  }
  
  let signalSum = 0;
  for (let i = 0; i < signalPeriod; i++) {
    signalSum += macdLine[i].value;
  }
  
  let signalValue = signalSum / signalPeriod;
  
  // Pierwszy wynik
  result.push({
    timestamp: macdLine[signalPeriod - 1].timestamp,
    value: macdLine[signalPeriod - 1].value,
    additionalValues: {
      signal: parseFloat(signalValue.toFixed(4)),
      histogram: parseFloat((macdLine[signalPeriod - 1].value - signalValue).toFixed(4))
    }
  });
  
  // Mnożnik dla EMA
  const multiplier = 2 / (signalPeriod + 1);
  
  // Oblicz pozostałe wartości
  for (let i = signalPeriod; i < macdLine.length; i++) {
    const macdValue = macdLine[i].value;
    signalValue = (macdValue - signalValue) * multiplier + signalValue;
    
    result.push({
      timestamp: macdLine[i].timestamp,
      value: parseFloat(macdValue.toFixed(4)),
      additionalValues: {
        signal: parseFloat(signalValue.toFixed(4)),
        histogram: parseFloat((macdValue - signalValue).toFixed(4))
      }
    });
  }
  
  return result;
}

// Funkcja do obliczania Bollinger Bands
export function calculateBollingerBands(
  prices: StockPrice[],
  period: number = 20,
  deviations: number = 2
): TechnicalIndicatorData[] {
  const result: TechnicalIndicatorData[] = [];
  
  if (prices.length < period) {
    return result;
  }
  
  for (let i = period - 1; i < prices.length; i++) {
    const windowPrices = prices.slice(i - period + 1, i + 1);
    
    // Oblicz SMA
    const sma = windowPrices.reduce((sum, price) => sum + price.close, 0) / period;
    
    // Oblicz odchylenie standardowe
    const squaredDifferences = windowPrices.map(price => Math.pow(price.close - sma, 2));
    const variance = squaredDifferences.reduce((sum, val) => sum + val, 0) / period;
    const standardDeviation = Math.sqrt(variance);
    
    // Oblicz górną i dolną wstęgę
    const upperBand = sma + (deviations * standardDeviation);
    const lowerBand = sma - (deviations * standardDeviation);
    
    result.push({
      timestamp: prices[i].timestamp,
      value: parseFloat(sma.toFixed(4)),
      additionalValues: {
        upper: parseFloat(upperBand.toFixed(4)),
        lower: parseFloat(lowerBand.toFixed(4))
      }
    });
  }
  
  return result;
}

// Funkcja do obliczania ATR (Average True Range)
export function calculateATR(prices: StockPrice[], period: number = 14): TechnicalIndicatorData[] {
  const result: TechnicalIndicatorData[] = [];
  
  if (prices.length < period + 1) {
    return result;
  }
  
  // Oblicz początkowe TR (True Range)
  const trValues: number[] = [];
  
  for (let i = 1; i < prices.length; i++) {
    const high = prices[i].high;
    const low = prices[i].low;
    const prevClose = prices[i - 1].close;
    
    const tr1 = high - low;
    const tr2 = Math.abs(high - prevClose);
    const tr3 = Math.abs(low - prevClose);
    
    const tr = Math.max(tr1, tr2, tr3);
    trValues.push(tr);
  }
  
  // Oblicz pierwszy ATR jako prostą średnią
  let atr = trValues.slice(0, period).reduce((a, b) => a + b, 0) / period;
  
  result.push({
    timestamp: prices[period].timestamp,
    value: parseFloat(atr.toFixed(4))
  });
  
  // Oblicz pozostałe ATR
  for (let i = period; i < trValues.length; i++) {
    atr = ((atr * (period - 1)) + trValues[i]) / period;
    
    result.push({
      timestamp: prices[i + 1].timestamp,
      value: parseFloat(atr.toFixed(4))
    });
  }
  
  return result;
}

// Słownik z dostępnymi wskaźnikami technicznymi
export const availableTechnicalIndicators = [
  'sma',
  'ema',
  'rsi',
  'macd',
  'bollinger',
  'atr'
];

// Funkcja wybierająca odpowiednią metodę obliczania wskaźnika
export function calculateIndicator(
  prices: StockPrice[],
  indicator: string,
  params: any = {}
): TechnicalIndicatorData[] {
  switch (indicator.toLowerCase()) {
    case 'sma':
      return calculateSMA(prices, params.period || 20);
    case 'ema':
      return calculateEMA(prices, params.period || 20);
    case 'rsi':
      return calculateRSI(prices, params.period || 14);
    case 'macd':
      return calculateMACD(
        prices,
        params.fastPeriod || 12,
        params.slowPeriod || 26,
        params.signalPeriod || 9
      );
    case 'bollinger':
      return calculateBollingerBands(
        prices,
        params.period || 20,
        params.deviations || 2
      );
    case 'atr':
      return calculateATR(prices, params.period || 14);
    default:
      return [];
  }
} 