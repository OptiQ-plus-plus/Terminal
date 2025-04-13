import { ProbabilityDistribution, PredictionModel } from '../models/stock.model';
import { PredictionResult } from './stock.service';

// Funkcja generująca modele predykcyjne
export function generatePredictionModels(symbol: string, count: number = 3): PredictionModel[] {
  const models: PredictionModel[] = [];
  const modelTypes = [
    'Regresja liniowa',
    'Sieć neuronowa',
    'LSTM',
    'ARIMA',
    'Random Forest',
    'Kwantowy regulator'
  ];
  
  const modelDescriptions = [
    'Model oparty na analizie historycznych trendów cenowych',
    'Model uwzględniający wskaźniki makroekonomiczne i sentiment rynku',
    'Model regresyjny z wagami kwantowymi',
    'Algorytm Deep Learning z optymalizacją kwantową',
    'Hybrydowy model statystyczno-kwantowy'
  ];
  
  for (let i = 0; i < count; i++) {
    const createdDate = new Date();
    createdDate.setDate(createdDate.getDate() - Math.floor(Math.random() * 100));
    
    const updatedDate = new Date(createdDate);
    updatedDate.setDate(updatedDate.getDate() + Math.floor(Math.random() * 30));
    
    models.push({
      id: `model-${symbol}-${i+1}`,
      name: `${modelTypes[Math.floor(Math.random() * modelTypes.length)]} dla ${symbol}`,
      description: modelDescriptions[Math.floor(Math.random() * modelDescriptions.length)],
      targetSymbol: symbol,
      predictionHorizon: [7, 14, 30, 60, 90][Math.floor(Math.random() * 5)],
      confidence: 0.65 + Math.random() * 0.3,
      createdAt: createdDate.toISOString(),
      lastUpdated: updatedDate.toISOString()
    });
  }
  
  return models;
}

// Funkcja generująca rozkład prawdopodobieństwa dla predykcji ceny
export function generateProbabilityDistribution(
  symbol: string,
  basePrice: number,
  daysAhead: number,
  volatility: number = 0.2
): ProbabilityDistribution {
  // Parametry rozkładu
  const expectedValue = basePrice * (1 + (Math.random() * 0.1 - 0.03) * (daysAhead / 30));
  const variance = Math.pow(basePrice * volatility * Math.sqrt(daysAhead / 365), 2);
  const skewness = Math.random() * 0.4 - 0.2; // Lekka asymetria
  const kurtosis = 3 + Math.random() * 2; // Normalne lub lekko grubsze ogony
  
  // Generuj punkty dyskretne rozkładu
  const discretePoints: { value: number; probability: number }[] = [];
  const pointsCount = 50;
  const minPrice = expectedValue - 3 * Math.sqrt(variance);
  const maxPrice = expectedValue + 3 * Math.sqrt(variance);
  const step = (maxPrice - minPrice) / (pointsCount - 1);
  
  let totalProbability = 0;
  
  for (let i = 0; i < pointsCount; i++) {
    const price = minPrice + i * step;
    const standardizedValue = (price - expectedValue) / Math.sqrt(variance);
    
    // Użyj przybliżonej funkcji gęstości prawdopodobieństwa
    let probability = Math.exp(-0.5 * Math.pow(standardizedValue, 2)) / Math.sqrt(2 * Math.PI);
    
    // Dodaj asymetrię i kurtozę
    probability *= (1 + skewness * standardizedValue + (kurtosis - 3) * Math.pow(standardizedValue, 3) / 6);
    
    discretePoints.push({
      value: parseFloat(price.toFixed(2)),
      probability: probability
    });
    
    totalProbability += probability;
  }
  
  // Normalizuj prawdopodobieństwa
  discretePoints.forEach(point => {
    point.probability = parseFloat((point.probability / totalProbability).toFixed(6));
  });
  
  // Generuj przedziały ufności
  const confidenceIntervals = [
    {
      lowerBound: parseFloat((expectedValue - 1.645 * Math.sqrt(variance)).toFixed(2)),
      upperBound: parseFloat((expectedValue + 1.645 * Math.sqrt(variance)).toFixed(2)),
      confidence: 0.9
    },
    {
      lowerBound: parseFloat((expectedValue - 1.96 * Math.sqrt(variance)).toFixed(2)),
      upperBound: parseFloat((expectedValue + 1.96 * Math.sqrt(variance)).toFixed(2)),
      confidence: 0.95
    },
    {
      lowerBound: parseFloat((expectedValue - 2.576 * Math.sqrt(variance)).toFixed(2)),
      upperBound: parseFloat((expectedValue + 2.576 * Math.sqrt(variance)).toFixed(2)),
      confidence: 0.99
    }
  ];
  
  return {
    expectedValue: parseFloat(expectedValue.toFixed(2)),
    variance: parseFloat(variance.toFixed(4)),
    skewness: parseFloat(skewness.toFixed(4)),
    kurtosis: parseFloat(kurtosis.toFixed(4)),
    confidenceIntervals,
    discretePoints
  };
}

// Generuj predykcję w formacie używanym przez istniejącą metodę serwisu
export function generatePredictionResult(
  symbol: string,
  basePrice: number,
  daysAhead: number,
  volatility: number = 0.2
): PredictionResult {
  const dist = generateProbabilityDistribution(symbol, basePrice, daysAhead, volatility);
  
  return {
    expectedValue: dist.expectedValue,
    variance: dist.variance,
    skewness: dist.skewness,
    kurtosis: dist.kurtosis,
    confidenceIntervals: dist.confidenceIntervals.map(ci => ({
      level: ci.confidence,
      min: ci.lowerBound,
      max: ci.upperBound
    })),
    distribution: dist.discretePoints.map(dp => ({
      price: dp.value,
      probability: dp.probability
    }))
  };
}

// Definiuj mocki modeli predykcyjnych dla akcji
export const mockPredictionModels: { [key: string]: PredictionModel[] } = {
  'AAPL': generatePredictionModels('AAPL', 3),
  'MSFT': generatePredictionModels('MSFT', 2),
  'GOOGL': generatePredictionModels('GOOGL', 4),
  'AMZN': generatePredictionModels('AMZN', 3),
  'TSLA': generatePredictionModels('TSLA', 5),
  'FB': generatePredictionModels('FB', 2),
  'NVDA': generatePredictionModels('NVDA', 3),
  'JPM': generatePredictionModels('JPM', 2),
  'KO': generatePredictionModels('KO', 2),
  'DIS': generatePredictionModels('DIS', 2)
}; 