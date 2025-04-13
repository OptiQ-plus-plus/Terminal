import { OptionWithGreeks, OptionContract } from '../models/stock.model';

// Funkcja do generowania dat wygaśnięcia opcji (trzeci piątek miesiąca)
function generateExpirationDates(months: number): string[] {
  const dates: string[] = [];
  const currentDate = new Date();
  
  for (let i = 0; i < months; i++) {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth() + i;
    const adjustedYear = year + Math.floor(month / 12);
    const adjustedMonth = month % 12;
    
    // Znajdź trzeci piątek miesiąca
    const firstDay = new Date(adjustedYear, adjustedMonth, 1);
    const dayOfWeek = firstDay.getDay();
    const daysUntilFriday = (dayOfWeek <= 5) ? (5 - dayOfWeek) : (12 - dayOfWeek);
    const thirdFriday = new Date(adjustedYear, adjustedMonth, 1 + daysUntilFriday + 14);
    
    dates.push(thirdFriday.toISOString().split('T')[0]);
  }
  
  return dates;
}

// Funkcja do obliczania greckich wartości opcji (symulowane)
function calculateGreeks(
  stockPrice: number, 
  strikePrice: number, 
  daysToExpiry: number, 
  volatility: number,
  isCall: boolean,
  riskFreeRate: number = 0.03
): { delta: number; gamma: number; theta: number; vega: number; rho: number; } {
  // Uproszczone obliczenia dla celów demonstracyjnych
  const timeToExpiry = daysToExpiry / 365;
  const sqrtTime = Math.sqrt(timeToExpiry);
  
  // Uproszczone wzory dla greckich wartości
  const moneyness = stockPrice / strikePrice;
  const sign = isCall ? 1 : -1;
  
  let delta = sign * 0.5 + (sign * 0.5 * (moneyness - 1) * 2);
  delta = Math.max(0, Math.min(1, delta));  // Ograniczenie do [0,1]
  
  const gamma = 0.1 * Math.exp(-Math.pow((moneyness - 1) * 5, 2));
  const theta = -volatility * stockPrice * gamma / (2 * sqrtTime) * 365;
  const vega = stockPrice * sqrtTime * gamma * 0.1;
  const rho = sign * strikePrice * timeToExpiry * 0.01;
  
  return {
    delta: parseFloat(delta.toFixed(4)),
    gamma: parseFloat(gamma.toFixed(4)),
    theta: parseFloat(theta.toFixed(4)),
    vega: parseFloat(vega.toFixed(4)),
    rho: parseFloat(rho.toFixed(4))
  };
}

// Funkcja generująca kontrakty opcyjne dla danego symbolu i ceny bazowej
function generateOptions(
  symbol: string, 
  basePrice: number, 
  expirationDate: string
): OptionWithGreeks[] {
  const options: OptionWithGreeks[] = [];
  
  // Oblicz dni do wygaśnięcia
  const expiry = new Date(expirationDate);
  const today = new Date();
  const daysToExpiry = Math.max(1, Math.round((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)));
  
  // Generuj opcje call i put dla różnych cen wykonania
  const strikes = [];
  const strikesCount = 11; // Nieparzysta liczba, aby mieć jedną w cenie
  const strikeStep = basePrice * 0.05; // 5% skok
  
  for (let i = 0; i < strikesCount; i++) {
    const offset = i - Math.floor(strikesCount / 2);
    strikes.push(parseFloat((basePrice + offset * strikeStep).toFixed(2)));
  }
  
  // Dla każdej ceny wykonania generuj opcje call i put
  strikes.forEach(strikePrice => {
    const isInTheMoney = {
      call: basePrice > strikePrice,
      put: basePrice < strikePrice
    };
    
    const impliedVolatility = {
      call: 0.2 + Math.random() * 0.2 + Math.abs(basePrice - strikePrice) / basePrice * 0.3,
      put: 0.2 + Math.random() * 0.2 + Math.abs(basePrice - strikePrice) / basePrice * 0.3
    };
    
    // Generuj opcję call
    const callDelta = (basePrice - strikePrice) / basePrice + 0.5;
    const callPrice = Math.max(0, basePrice - strikePrice) + (impliedVolatility.call * basePrice * Math.sqrt(daysToExpiry / 365));
    const callBid = parseFloat((callPrice * 0.95).toFixed(2));
    const callAsk = parseFloat((callPrice * 1.05).toFixed(2));
    const callChange = parseFloat((callPrice * (Math.random() * 0.1 - 0.05)).toFixed(2));
    const callPercentChange = parseFloat(((callChange / callPrice) * 100).toFixed(2));
    
    // Generuj opcję put
    const putDelta = (strikePrice - basePrice) / basePrice - 0.5;
    const putPrice = Math.max(0, strikePrice - basePrice) + (impliedVolatility.put * basePrice * Math.sqrt(daysToExpiry / 365));
    const putBid = parseFloat((putPrice * 0.95).toFixed(2));
    const putAsk = parseFloat((putPrice * 1.05).toFixed(2));
    const putChange = parseFloat((putPrice * (Math.random() * 0.1 - 0.05)).toFixed(2));
    const putPercentChange = parseFloat(((putChange / putPrice) * 100).toFixed(2));
    
    // Wspólne właściwości
    const volume = Math.floor(Math.random() * 5000);
    const openInterest = Math.floor(Math.random() * 10000) + volume;
    const lastTradeDate = new Date(today);
    lastTradeDate.setHours(lastTradeDate.getHours() - Math.floor(Math.random() * 8));
    
    // Dodaj opcję call
    options.push({
      symbol: `${symbol}${expiry.getMonth() + 1}${expiry.getDate()}C${strikePrice}`,
      underlyingSymbol: symbol,
      expirationDate,
      strikePrice,
      optionType: 'call',
      lastPrice: parseFloat(callPrice.toFixed(2)),
      bid: callBid,
      ask: callAsk,
      change: callChange,
      percentChange: callPercentChange,
      volume,
      openInterest,
      impliedVolatility: parseFloat(impliedVolatility.call.toFixed(4)),
      inTheMoney: isInTheMoney.call,
      lastTradeDate: lastTradeDate.toISOString(),
      greeks: calculateGreeks(basePrice, strikePrice, daysToExpiry, impliedVolatility.call, true)
    });
    
    // Dodaj opcję put
    options.push({
      symbol: `${symbol}${expiry.getMonth() + 1}${expiry.getDate()}P${strikePrice}`,
      underlyingSymbol: symbol,
      expirationDate,
      strikePrice,
      optionType: 'put',
      lastPrice: parseFloat(putPrice.toFixed(2)),
      bid: putBid,
      ask: putAsk,
      change: putChange,
      percentChange: putPercentChange,
      volume,
      openInterest,
      impliedVolatility: parseFloat(impliedVolatility.put.toFixed(4)),
      inTheMoney: isInTheMoney.put,
      lastTradeDate: lastTradeDate.toISOString(),
      greeks: calculateGreeks(basePrice, strikePrice, daysToExpiry, impliedVolatility.put, false)
    });
  });
  
  return options;
}

// Generuj daty wygaśnięcia dla wszystkich symboli
export const mockExpirationDates: { [key: string]: string[] } = {
  'AAPL': generateExpirationDates(6),
  'MSFT': generateExpirationDates(6),
  'GOOGL': generateExpirationDates(6),
  'AMZN': generateExpirationDates(6),
  'TSLA': generateExpirationDates(6),
  'FB': generateExpirationDates(6),
  'NVDA': generateExpirationDates(6),
  'JPM': generateExpirationDates(6),
  'KO': generateExpirationDates(6),
  'DIS': generateExpirationDates(6)
};

// Inicjalizuj dane opcji dla poszczególnych symboli
export const mockOptionsData: { [key: string]: { [expirationDate: string]: OptionWithGreeks[] } } = {
  'AAPL': {},
  'MSFT': {},
  'GOOGL': {},
  'AMZN': {},
  'TSLA': {},
  'FB': {},
  'NVDA': {},
  'JPM': {},
  'KO': {},
  'DIS': {}
};

// Ceny akcji dla różnych symboli (będziemy używać do generowania opcji)
const stockPrices: { [key: string]: number } = {
  'AAPL': 180,
  'MSFT': 340,
  'GOOGL': 140,
  'AMZN': 160,
  'TSLA': 220,
  'FB': 460,
  'NVDA': 760,
  'JPM': 165,
  'KO': 58,
  'DIS': 100
};

// Generuj dane opcji dla każdego symbolu i każdej daty wygaśnięcia
Object.keys(mockOptionsData).forEach(symbol => {
  mockExpirationDates[symbol].forEach(expirationDate => {
    mockOptionsData[symbol][expirationDate] = generateOptions(
      symbol,
      stockPrices[symbol as keyof typeof stockPrices],
      expirationDate
    );
  });
}); 