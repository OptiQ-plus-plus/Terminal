import { OptimizationParameters, QumoMatrix } from '../models/stock.model';

// Interfejs reprezentujący optymalną pozycję opcyjną
export interface OptimalPosition {
  symbol: string;
  type: 'call' | 'put';
  strikePrice: number;
  expirationDate: string;
  quantity: number;
  expectedReturn: number;
  maxLoss: number;
  probability: number;
  sharpeRatio: number;
}

// Interfejs reprezentujący wynik optymalizacji strategii
export interface OptimizationResult {
  totalExpectedReturn: number;
  totalRisk: number;
  sharpeRatio: number;
  maxDrawdown: number;
  returnToRiskRatio: number;
  winProbability: number;
  positions: OptimalPosition[];
  payoffCurve: {
    price: number;
    profit: number;
  }[];
  quantumAdvantage: number; // procentowa poprawa w porównaniu do klasycznych metod
  confidenceScore: number;
  executionTime: number; // czas wykonania w ms
}

// Funkcja generująca optymalną pozycję opcyjną
function generateOptimalPosition(
  symbol: string,
  basePrice: number,
  riskAttitude: number
): OptimalPosition {
  // Parametry zależne od nastawienia do ryzyka
  const isCallBiased = riskAttitude > 0;
  const type = Math.random() > (isCallBiased ? 0.7 : 0.3) ? 'call' : 'put';
  
  // Ustal cenę wykonania (ITM, ATM lub OTM)
  let strikePrice;
  if (type === 'call') {
    // Dla opcji call - niższa cena wykonania oznacza pozycję bardziej ITM
    const strikeDelta = basePrice * (0.2 - (riskAttitude * 0.15));
    strikePrice = parseFloat((basePrice - strikeDelta + (Math.random() * strikeDelta * 2)).toFixed(2));
  } else {
    // Dla opcji put - wyższa cena wykonania oznacza pozycję bardziej ITM
    const strikeDelta = basePrice * (0.2 + (riskAttitude * 0.15));
    strikePrice = parseFloat((basePrice + strikeDelta - (Math.random() * strikeDelta * 2)).toFixed(2));
  }
  
  // Generuj datę wygaśnięcia (od 1 do 3 miesięcy w przyszłości)
  const months = Math.floor(Math.random() * 3) + 1;
  const expirationDate = new Date();
  expirationDate.setMonth(expirationDate.getMonth() + months);
  
  // Ustal trzeci piątek miesiąca jako datę wygaśnięcia
  const dayOfMonth = 1;
  expirationDate.setDate(dayOfMonth);
  const dayOfWeek = expirationDate.getDay();
  const daysUntilFriday = (dayOfWeek <= 5) ? (5 - dayOfWeek) : (12 - dayOfWeek);
  expirationDate.setDate(dayOfMonth + daysUntilFriday + 14); // Trzeci piątek
  
  // Parametry pozycji
  const quantity = Math.floor(Math.random() * 10) + 1;
  const expectedReturn = parseFloat(((Math.random() * 30) + 5 * (riskAttitude + 1)).toFixed(2));
  const maxLoss = parseFloat(((Math.random() * 20) + 10 * (1 - riskAttitude)).toFixed(2));
  const probability = parseFloat((0.5 + (riskAttitude * 0.1) + (Math.random() * 0.3)).toFixed(3));
  const sharpeRatio = parseFloat((expectedReturn / maxLoss).toFixed(3));
  
  return {
    symbol,
    type,
    strikePrice,
    expirationDate: expirationDate.toISOString().split('T')[0],
    quantity,
    expectedReturn,
    maxLoss,
    probability,
    sharpeRatio
  };
}

// Funkcja generująca wykres potencjalnych zysków/strat
function generatePayoffCurve(
  basePrice: number,
  positions: OptimalPosition[]
): { price: number; profit: number }[] {
  const curve: { price: number; profit: number }[] = [];
  const minPrice = basePrice * 0.7;
  const maxPrice = basePrice * 1.3;
  const steps = 50;
  const priceStep = (maxPrice - minPrice) / (steps - 1);
  
  for (let i = 0; i < steps; i++) {
    const price = minPrice + i * priceStep;
    let totalProfit = 0;
    
    // Oblicz zysk dla każdej pozycji przy danej cenie
    positions.forEach(position => {
      let positionProfit = 0;
      
      if (position.type === 'call') {
        // Zysk z opcji call = max(0, cena aktualna - cena wykonania) * ilość
        positionProfit = Math.max(0, price - position.strikePrice) * position.quantity;
        // Odejmij koszt nabycia opcji (uproszczenie)
        positionProfit -= position.maxLoss;
      } else {
        // Zysk z opcji put = max(0, cena wykonania - cena aktualna) * ilość
        positionProfit = Math.max(0, position.strikePrice - price) * position.quantity;
        // Odejmij koszt nabycia opcji (uproszczenie)
        positionProfit -= position.maxLoss;
      }
      
      totalProfit += positionProfit;
    });
    
    curve.push({
      price: parseFloat(price.toFixed(2)),
      profit: parseFloat(totalProfit.toFixed(2))
    });
  }
  
  return curve;
}

// Funkcja generująca wynik optymalizacji strategii
export function generateOptimizationResult(
  symbols: string[],
  params: OptimizationParameters,
  stockPrices: { [key: string]: number }
): OptimizationResult {
  // Generuj optymalne pozycje dla każdego symbolu
  const positions: OptimalPosition[] = [];
  
  symbols.forEach(symbol => {
    const basePrice = stockPrices[symbol] || 100;
    const positionsCount = Math.floor(Math.random() * 3) + 1; // 1-3 pozycje na symbol
    
    for (let i = 0; i < positionsCount; i++) {
      positions.push(generateOptimalPosition(symbol, basePrice, params.riskAttitude));
    }
  });
  
  // Oblicz sumaryczne wskaźniki
  const totalExpectedReturn = parseFloat(positions
    .reduce((sum, pos) => sum + pos.expectedReturn, 0)
    .toFixed(2));
  
  const totalRisk = parseFloat(positions
    .reduce((sum, pos) => sum + pos.maxLoss, 0)
    .toFixed(2));
  
  const sharpeRatio = parseFloat((totalExpectedReturn / totalRisk).toFixed(3));
  const maxDrawdown = parseFloat((totalRisk * 0.8).toFixed(2));
  const returnToRiskRatio = parseFloat((totalExpectedReturn / totalRisk).toFixed(3));
  const winProbability = parseFloat((
    positions.reduce((sum, pos) => sum + pos.probability, 0) / positions.length
  ).toFixed(3));
  
  // Generuj wykres wypłaty dla pierwszego symbolu (uproszczenie)
  const payoffCurve = generatePayoffCurve(
    stockPrices[symbols[0]] || 100,
    positions.filter(p => p.symbol === symbols[0])
  );
  
  // Generuj inne wskaźniki
  const quantumAdvantage = parseFloat((Math.random() * 20 + 5).toFixed(1));
  const confidenceScore = parseFloat((0.75 + Math.random() * 0.2).toFixed(3));
  const executionTime = Math.floor(Math.random() * 500) + 100;
  
  return {
    totalExpectedReturn,
    totalRisk,
    sharpeRatio,
    maxDrawdown,
    returnToRiskRatio,
    winProbability,
    positions,
    payoffCurve,
    quantumAdvantage,
    confidenceScore,
    executionTime
  };
}

// Funkcja generująca macierz QUMO dla obliczeń kwantowych
export function generateQumoMatrix(dimensions: number): QumoMatrix {
  const matrix: number[][] = [];
  
  // Generuj symetryczną macierz
  for (let i = 0; i < dimensions; i++) {
    matrix[i] = [];
    for (let j = 0; j < dimensions; j++) {
      if (i === j) {
        // Elementy diagonalne
        matrix[i][j] = parseFloat((Math.random() * 2 - 1).toFixed(4));
      } else if (j > i) {
        // Elementy nad diagonalą
        matrix[i][j] = parseFloat((Math.random() * 2 - 1).toFixed(4));
      } else {
        // Elementy pod diagonalą (symetria)
        matrix[i][j] = matrix[j][i];
      }
    }
  }
  
  // Generuj wartości własne
  const eigenvalues = [];
  for (let i = 0; i < dimensions; i++) {
    eigenvalues.push(parseFloat((Math.random() * 4 - 2).toFixed(4)));
  }
  
  // Generuj wektor wynikowy
  const resultVector = [];
  for (let i = 0; i < dimensions; i++) {
    resultVector.push(parseFloat((Math.random() * 2 - 1).toFixed(4)));
  }
  
  return {
    dimensions,
    matrix,
    eigenvalues,
    resultVector
  };
}

// Ceny akcji dla różnych symboli (do użycia przy generowaniu danych optymalizacji)
export const stockPrices: { [key: string]: number } = {
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