import { StockData, StockPrice, StockMetadata } from '../models/stock.model';

export const mockStockMetadataList: StockMetadata[] = [
  {
    symbol: 'AAPL',
    name: 'Apple Inc.',
    type: 'Equity',
    region: 'United States',
    currency: 'USD'
  },
  {
    symbol: 'MSFT',
    name: 'Microsoft Corporation',
    type: 'Equity',
    region: 'United States',
    currency: 'USD'
  },
  {
    symbol: 'GOOGL',
    name: 'Alphabet Inc.',
    type: 'Equity',
    region: 'United States',
    currency: 'USD'
  },
  {
    symbol: 'AMZN',
    name: 'Amazon.com Inc.',
    type: 'Equity',
    region: 'United States',
    currency: 'USD'
  },
  {
    symbol: 'TSLA',
    name: 'Tesla, Inc.',
    type: 'Equity',
    region: 'United States',
    currency: 'USD'
  },
  {
    symbol: 'FB',
    name: 'Meta Platforms, Inc.',
    type: 'Equity',
    region: 'United States',
    currency: 'USD'
  },
  {
    symbol: 'NVDA',
    name: 'NVIDIA Corporation',
    type: 'Equity',
    region: 'United States',
    currency: 'USD'
  },
  {
    symbol: 'JPM',
    name: 'JPMorgan Chase & Co.',
    type: 'Equity',
    region: 'United States',
    currency: 'USD'
  },
  {
    symbol: 'KO',
    name: 'The Coca-Cola Company',
    type: 'Equity',
    region: 'United States',
    currency: 'USD'
  },
  {
    symbol: 'DIS',
    name: 'The Walt Disney Company',
    type: 'Equity',
    region: 'United States',
    currency: 'USD'
  }
];

// Funkcja do generowania realistycznych danych cen akcji
function generateStockPrices(basePrice: number, days: number): StockPrice[] {
  const prices: StockPrice[] = [];
  let currentPrice = basePrice;
  let date = new Date();
  date.setDate(date.getDate() - days);

  for (let i = 0; i < days; i++) {
    const volatility = Math.random() * 0.03; // 0-3% zmienności dziennej
    const changePercent = (Math.random() * 2 - 1) * volatility;
    const change = currentPrice * changePercent;
    const newPrice = currentPrice + change;
    
    const open = currentPrice;
    const close = newPrice;
    const high = Math.max(open, close) * (1 + Math.random() * 0.01);
    const low = Math.min(open, close) * (1 - Math.random() * 0.01);
    const volume = Math.floor(Math.random() * 10000000) + 1000000;
    
    const dateStr = date.toISOString().split('T')[0];
    
    prices.push({
      timestamp: dateStr,
      open: parseFloat(open.toFixed(2)),
      high: parseFloat(high.toFixed(2)),
      low: parseFloat(low.toFixed(2)),
      close: parseFloat(close.toFixed(2)),
      volume: volume
    });
    
    currentPrice = close;
    date.setDate(date.getDate() + 1);
  }
  
  // Odwróć dane, aby najnowsze były na początku
  return prices.reverse();
}

// Mock danych historycznych dla różnych spółek
export const mockStockData: { [key: string]: StockData } = {
  'AAPL': {
    symbol: 'AAPL',
    name: 'Apple Inc.',
    interval: 'daily',
    lastRefreshed: new Date().toISOString(),
    prices: generateStockPrices(180, 365)
  },
  'MSFT': {
    symbol: 'MSFT',
    name: 'Microsoft Corporation',
    interval: 'daily',
    lastRefreshed: new Date().toISOString(),
    prices: generateStockPrices(340, 365)
  },
  'GOOGL': {
    symbol: 'GOOGL',
    name: 'Alphabet Inc.',
    interval: 'daily',
    lastRefreshed: new Date().toISOString(),
    prices: generateStockPrices(140, 365)
  },
  'AMZN': {
    symbol: 'AMZN',
    name: 'Amazon.com Inc.',
    interval: 'daily',
    lastRefreshed: new Date().toISOString(),
    prices: generateStockPrices(160, 365)
  },
  'TSLA': {
    symbol: 'TSLA',
    name: 'Tesla, Inc.',
    interval: 'daily',
    lastRefreshed: new Date().toISOString(),
    prices: generateStockPrices(220, 365)
  },
  'FB': {
    symbol: 'FB',
    name: 'Meta Platforms, Inc.',
    interval: 'daily',
    lastRefreshed: new Date().toISOString(),
    prices: generateStockPrices(460, 365)
  },
  'NVDA': {
    symbol: 'NVDA',
    name: 'NVIDIA Corporation',
    interval: 'daily',
    lastRefreshed: new Date().toISOString(),
    prices: generateStockPrices(760, 365)
  },
  'JPM': {
    symbol: 'JPM',
    name: 'JPMorgan Chase & Co.',
    interval: 'daily',
    lastRefreshed: new Date().toISOString(),
    prices: generateStockPrices(165, 365)
  },
  'KO': {
    symbol: 'KO',
    name: 'The Coca-Cola Company',
    interval: 'daily',
    lastRefreshed: new Date().toISOString(),
    prices: generateStockPrices(58, 365)
  },
  'DIS': {
    symbol: 'DIS',
    name: 'The Walt Disney Company',
    interval: 'daily',
    lastRefreshed: new Date().toISOString(),
    prices: generateStockPrices(100, 365)
  }
}; 