import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map, delay } from 'rxjs/operators';
import { 
  ApiResponse, StockData, StockMetadata, OptionContract, 
  OptionWithGreeks, ProbabilityDistribution, OptimizationParameters,
  QumoMatrix, ApiSettings
} from '../models/stock.model';
import { environment } from '../../environments/environment';

// Import mocków danych
import { mockStockMetadataList, mockStockData } from './mock-stock-data';
import { mockOptionsData, mockExpirationDates } from './mock-options-data';
import { 
  generatePredictionModels, 
  generateProbabilityDistribution, 
  generatePredictionResult,
  mockPredictionModels
} from './mock-prediction-data';
import { 
  availableTechnicalIndicators, 
  calculateIndicator 
} from './mock-indicators-data';
import {
  generateOptimizationResult,
  generateQumoMatrix,
  stockPrices as stockPriceMap
} from './mock-optimization-data';

export interface OptionsData {
  symbol: string;
  date: string;
  expDate: string;
  strikePrice: number;
  lastPrice: number;
  bid: number;
  ask: number;
  change: number;
  volume: number;
  openInterest: number;
  impliedVolatility: number;
}

export interface GreeksData {
  delta: number;
  gamma: number;
  theta: number;
  vega: number;
  rho: number;
}

export interface PredictionResult {
  expectedValue: number;
  variance: number;
  skewness: number;
  kurtosis: number;
  confidenceIntervals: {level: number, min: number, max: number}[];
  distribution: {price: number, probability: number}[];
}

@Injectable({
  providedIn: 'root'
})
export class StockService {
  private apiUrl = environment.apiUrl;
  private defaultSymbols = environment.defaultSymbols || ['IBM', 'INTC', 'TSLA'];
  private useMockData = true; // Flaga włączająca mocki zamiast faktycznych danych

  constructor(private http: HttpClient) { }

  // Metoda pomocnicza do bezpiecznego pobierania ceny akcji
  private getBasePrice(symbol: string): number {
    return (symbol in stockPriceMap) ? 
      (stockPriceMap as any)[symbol] : 100;
  }

  /**
   * Wyszukuje instrumenty giełdowe na podstawie zapytania
   */
  searchStocks(query: string): Observable<ApiResponse<StockMetadata[]>> {
    if (this.useMockData) {
      // Filtruj symbole zawierające zapytanie
      const filteredStocks = mockStockMetadataList.filter(stock => 
        stock.symbol.toLowerCase().includes(query.toLowerCase()) || 
        stock.name.toLowerCase().includes(query.toLowerCase())
      );
      
      // Dodaj ocenę dopasowania
      const matchedStocks = filteredStocks.map(stock => ({
        ...stock,
        matchScore: stock.symbol.toLowerCase() === query.toLowerCase() ? 1.0 : 0.8
      }));
      
      return of({
        status: 'success',
        data: matchedStocks
      }).pipe(delay(300)); // Symuluj opóźnienie sieciowe
    }
    
    const params = new HttpParams().set('query', query);
    return this.http.get<ApiResponse<StockMetadata[]>>(`${this.apiUrl}/stocks/search`, { params });
  }

  /**
   * Pobiera dane giełdowe dla określonego symbolu
   */
  getStockData(
    symbol: string, 
    interval: string = 'daily',
    period?: string,
    startDate?: string,
    endDate?: string
  ): Observable<ApiResponse<StockData>> {
    if (this.useMockData) {
      // Znajdź dane dla danego symbolu
      const stockData = mockStockData[symbol];
      
      if (!stockData) {
        return of({
          status: 'error',
          message: `Nie znaleziono danych dla symbolu ${symbol}`
        }).pipe(delay(300));
      }
      
      // Filtrowanie danych zgodnie z okresem
      let filteredPrices = [...stockData.prices];
      
      if (period) {
        const daysMap: {[key: string]: number} = {
          '1d': 1,
          '5d': 5,
          '1m': 30,
          '3m': 90,
          '6m': 180,
          '1y': 365,
          '2y': 730,
          '5y': 1825
        };
        
        const days = daysMap[period] || 30;
        filteredPrices = filteredPrices.slice(0, days);
      } else if (startDate && endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        
        filteredPrices = filteredPrices.filter(price => {
          const date = new Date(price.timestamp);
          return date >= start && date <= end;
        });
      }
      
      return of({
        status: 'success',
        data: {
          ...stockData,
          interval,
          prices: filteredPrices
        }
      }).pipe(delay(500));
    }
    
    let params = new HttpParams()
      .set('interval', interval);
    
    if (period) {
      params = params.set('period', period);
    }
    
    if (startDate) {
      params = params.set('startDate', startDate);
    }
    
    if (endDate) {
      params = params.set('endDate', endDate);
    }
    
    return this.http.get<ApiResponse<StockData>>(`${this.apiUrl}/stocks/${symbol}`, { params });
  }

  /**
   * Pobiera dane historyczne opcji dla wybranego symbolu bazowego
   */
  getOptionsData(
    symbol: string,
    expirationDate?: string,
    optionType?: 'call' | 'put',
    strikeRange?: { min: number, max: number }
  ): Observable<ApiResponse<OptionWithGreeks[]>> {
    if (this.useMockData) {
      // Sprawdź czy mamy dane dla tego symbolu
      if (!mockOptionsData[symbol]) {
        return of({
          status: 'error',
          message: `Nie znaleziono danych opcji dla symbolu ${symbol}`
        }).pipe(delay(300));
      }
      
      // Wybierz datę wygaśnięcia lub użyj pierwszej dostępnej
      const expDate = expirationDate || mockExpirationDates[symbol][0];
      
      // Pobierz dane dla tej daty wygaśnięcia
      const options = mockOptionsData[symbol][expDate] || [];
      
      // Filtruj według typu opcji
      let filteredOptions = options;
      if (optionType) {
        filteredOptions = filteredOptions.filter(option => option.optionType === optionType);
      }
      
      // Filtruj według zakresu cen wykonania
      if (strikeRange) {
        filteredOptions = filteredOptions.filter(option => 
          option.strikePrice >= strikeRange.min && option.strikePrice <= strikeRange.max
        );
      }
      
      return of({
        status: 'success',
        data: filteredOptions
      }).pipe(delay(500));
    }
    
    let params = new HttpParams();
    
    if (expirationDate) {
      params = params.set('expirationDate', expirationDate);
    }
    
    if (optionType) {
      params = params.set('optionType', optionType);
    }
    
    if (strikeRange) {
      params = params.set('minStrike', strikeRange.min.toString());
      params = params.set('maxStrike', strikeRange.max.toString());
    }
    
    return this.http.get<ApiResponse<OptionWithGreeks[]>>(`${this.apiUrl}/options/${symbol}`, { params });
  }

  /**
   * Pobiera dostępne daty wygaśnięcia dla opcji danego instrumentu
   */
  getOptionExpirationDates(symbol: string): Observable<ApiResponse<string[]>> {
    if (this.useMockData) {
      // Sprawdź czy mamy dane dla tego symbolu
      if (!mockExpirationDates[symbol]) {
        return of({
          status: 'error',
          message: `Nie znaleziono dat wygaśnięcia dla symbolu ${symbol}`
        }).pipe(delay(300));
      }
      
      return of({
        status: 'success',
        data: mockExpirationDates[symbol]
      }).pipe(delay(300));
    }
    
    return this.http.get<ApiResponse<string[]>>(`${this.apiUrl}/options/${symbol}/expirations`);
  }

  /**
   * Generuje predykcję rozkładu prawdopodobieństwa dla opcji
   */
  generateProbabilityDistribution(
    symbol: string,
    modelParams: any
  ): Observable<ApiResponse<ProbabilityDistribution>>;
  generateProbabilityDistribution(
    symbol: string,
    strikePrice: number,
    timeHorizon: number,
    volatilityMultiplier: number,
    confidenceLevel: number
  ): Observable<PredictionResult>;
  generateProbabilityDistribution(
    symbol: string,
    paramOrStrike: any,
    timeHorizon?: number,
    volatilityMultiplier?: number,
    confidenceLevel?: number
  ): Observable<any> {
    if (this.useMockData) {
      // Sprawdź, którą wersję metody wywołano
      if (typeof paramOrStrike === 'object') {
        // Pierwsza sygnatura (z modelParams jako obiekt)
        const basePrice = this.getBasePrice(symbol);
        const daysAhead = paramOrStrike.timeHorizon || 30;
        const volatility = paramOrStrike.volatility || 0.2;
        
        const distribution = generateProbabilityDistribution(symbol, basePrice, daysAhead, volatility);
        
        return of({
          status: 'success',
          data: distribution
        }).pipe(delay(700)); // Symuluj dłuższe obliczenia
      } else {
        // Druga sygnatura (z pojedynczymi parametrami)
        const basePrice = this.getBasePrice(symbol);
        const daysAhead = timeHorizon || 30;
        const volatility = (volatilityMultiplier || 1) * 0.2;
        
        const result = generatePredictionResult(symbol, basePrice, daysAhead, volatility);
        
        return of(result).pipe(delay(700));
      }
    }
    
    // Sprawdź, którą wersję metody wywołano
    if (typeof paramOrStrike === 'object') {
      // Pierwsza sygnatura (z modelParams jako obiekt)
      return this.http.post<ApiResponse<ProbabilityDistribution>>(
        `${this.apiUrl}/prediction/${symbol}`,
        paramOrStrike
      );
    } else {
      // Druga sygnatura (z pojedynczymi parametrami)
      return this.http.post<PredictionResult>(`${this.apiUrl}/prediction/distribution`, {
        symbol,
        strikePrice: paramOrStrike,
        timeHorizon,
        volatilityMultiplier,
        confidenceLevel
      }).pipe(
        catchError(error => {
          console.error(`generateProbabilityDistribution failed: ${error.message}`);
          return of({
            expectedValue: 0,
            variance: 0,
            skewness: 0,
            kurtosis: 0,
            confidenceIntervals: [],
            distribution: []
          });
        })
      );
    }
  }

  /**
   * Optymalizuje strategię opcyjną na podstawie parametrów
   */
  optimizeStrategy(
    symbols: string[],
    params: OptimizationParameters
  ): Observable<ApiResponse<any>> {
    if (this.useMockData) {
      // Przekształć stockPriceMap na typ z indeksem string dla generateOptimizationResult
      const stockPricesObj: { [key: string]: number } = { ...stockPriceMap as any };
      const result = generateOptimizationResult(symbols, params, stockPricesObj);
      
      return of({
        status: 'success',
        data: result
      }).pipe(delay(1000)); // Symuluj dłuższe obliczenia
    }
    
    return this.http.post<ApiResponse<any>>(
      `${this.apiUrl}/optimization`,
      { symbols, params }
    );
  }

  /**
   * Wysyła macierz QUMO do obliczenia na komputerze kwantowym
   */
  runQuantumComputation(matrix: QumoMatrix): Observable<ApiResponse<any>> {
    if (this.useMockData) {
      const result = generateQumoMatrix(matrix.dimensions);
      
      return of({
        status: 'success',
        data: {
          input: matrix,
          output: result,
          processingTime: Math.floor(Math.random() * 2000) + 500,
          quantumNoiseLevel: parseFloat((Math.random() * 0.1).toFixed(3)),
          qubitsUsed: matrix.dimensions * 2,
          optimizationLevel: 'Maksymalny',
          coherenceTime: parseFloat((Math.random() * 100 + 50).toFixed(1)),
        }
      }).pipe(delay(1500)); // Symuluj dłuższe obliczenia kwantowe
    }
    
    return this.http.post<ApiResponse<any>>(
      `${this.apiUrl}/quantum/compute`,
      { matrix }
    );
  }

  /**
   * Pobiera dane wskaźników technicznych dla określonego symbolu
   */
  getTechnicalIndicatorData(
    symbol: string,
    indicator: string,
    params?: any,
    startDate?: string,
    endDate?: string
  ): Observable<ApiResponse<any>> {
    if (this.useMockData) {
      // Sprawdź czy mamy dane dla tego symbolu
      if (!mockStockData[symbol]) {
        return of({
          status: 'error',
          message: `Nie znaleziono danych dla symbolu ${symbol}`
        }).pipe(delay(300));
      }
      
      // Filtruj dane cenowe zgodnie z datami
      let prices = [...mockStockData[symbol].prices];
      
      if (startDate && endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        
        prices = prices.filter(price => {
          const date = new Date(price.timestamp);
          return date >= start && date <= end;
        });
      }
      
      // Sprawdź czy wskaźnik jest obsługiwany
      if (!availableTechnicalIndicators.includes(indicator.toLowerCase())) {
        return of({
          status: 'error',
          message: `Wskaźnik ${indicator} nie jest obsługiwany`
        }).pipe(delay(300));
      }
      
      // Oblicz wskaźnik
      const indicatorData = calculateIndicator(prices, indicator, params);
      
      return of({
        status: 'success',
        data: indicatorData
      }).pipe(delay(400));
    }
    
    let httpParams = new HttpParams();
    
    if (params) {
      Object.keys(params).forEach(key => {
        httpParams = httpParams.set(key, params[key]);
      });
    }
    
    if (startDate) {
      httpParams = httpParams.set('startDate', startDate);
    }
    
    if (endDate) {
      httpParams = httpParams.set('endDate', endDate);
    }
    
    return this.http.get<ApiResponse<any>>(
      `${this.apiUrl}/indicators/${symbol}/${indicator}`, 
      { params: httpParams }
    ).pipe(
      catchError(error => {
        console.error(`Failed to get technical indicator data: ${error.message}`);
        return of({ status: 'error', message: error.message, data: null });
      })
    );
  }

  /**
   * Pobiera ustawienia API
   */
  getApiSettings(): Observable<ApiResponse<ApiSettings>> {
    if (this.useMockData) {
      return of({
        status: 'success',
        data: {
          providers: [
            {
              name: 'Alpha Vantage',
              baseUrl: 'https://www.alphavantage.co/query',
              apiKey: 'DEMO_API_KEY',
              rateLimit: 5,
              enabled: true
            },
            {
              name: 'Yahoo Finance',
              baseUrl: 'https://yfapi.net',
              apiKey: 'DEMO_API_KEY',
              rateLimit: 10,
              enabled: true
            },
            {
              name: 'Qumo Quantum API',
              baseUrl: 'https://api.qumo.io/v1',
              apiKey: 'QUMO_DEMO_KEY',
              rateLimit: 2,
              enabled: true
            }
          ],
          quantumComputerEndpoint: 'https://quantum.googleapis.com/v1alpha/processors/q1'
        }
      }).pipe(delay(300));
    }
    
    return this.http.get<ApiResponse<ApiSettings>>(`${this.apiUrl}/settings`);
  }

  /**
   * Aktualizuje ustawienia API
   */
  updateApiSettings(settings: ApiSettings): Observable<ApiResponse<ApiSettings>> {
    if (this.useMockData) {
      return of({
        status: 'success',
        message: 'Ustawienia zaktualizowane pomyślnie',
        data: settings
      }).pipe(delay(300));
    }
    
    return this.http.put<ApiResponse<ApiSettings>>(`${this.apiUrl}/settings`, settings);
  }

  /**
   * Sprawdza status połączenia z komputerem kwantowym
   */
  checkQuantumComputerStatus(): Observable<ApiResponse<{ status: string, available: boolean }>> {
    if (this.useMockData) {
      return of({
        status: 'success',
        data: {
          status: 'online',
          available: true
        }
      }).pipe(delay(500));
    }
    
    return this.http.get<ApiResponse<{ status: string, available: boolean }>>(
      `${this.apiUrl}/quantum/status`
    ).pipe(
      catchError(error => {
        console.error(`Failed to check quantum computer status: ${error.message}`);
        return of({
          status: 'error',
          message: error.message,
          data: { status: 'offline', available: false }
        });
      })
    );
  }

  /**
   * Zwraca listę dostępnych symboli
   */
  getAvailableSymbols(): Observable<string[]> {
    if (this.useMockData) {
      return of(Object.keys(mockStockData)).pipe(delay(200));
    }
    
    return this.http.get<string[]>(`${this.apiUrl}/stocks/symbols`);
  }

  /**
   * Pobiera dane greckie dla opcji
   */
  getGreeksData(symbol: string, strikePrice: number, expDate: string): Observable<GreeksData> {
    if (this.useMockData) {
      // Znajdź odpowiednią opcję
      const options = mockOptionsData[symbol]?.[expDate] || [];
      const option = options.find(opt => 
        opt.strikePrice === strikePrice && opt.optionType === 'call'
      );
      
      if (option) {
        return of(option.greeks).pipe(delay(300));
      }
      
      // Jeśli nie znaleziono, wygeneruj dane
      return of({
        delta: parseFloat((Math.random() * 0.8 + 0.1).toFixed(4)),
        gamma: parseFloat((Math.random() * 0.2).toFixed(4)),
        theta: parseFloat((-Math.random() * 0.5).toFixed(4)),
        vega: parseFloat((Math.random() * 0.3).toFixed(4)),
        rho: parseFloat((Math.random() * 0.2).toFixed(4))
      }).pipe(delay(300));
    }
    
    return this.http.get<GreeksData>(
      `${this.apiUrl}/options/${symbol}/greeks?strikePrice=${strikePrice}&expDate=${expDate}`
    );
  }

  /**
   * Symuluje proces kwantowy
   */
  simulateQuantumProcess(params: any): Observable<any> {
    if (this.useMockData) {
      return of({
        status: 'success',
        data: {
          simulationResults: {
            eigenvalues: [
              parseFloat((Math.random() * 2 - 1).toFixed(4)),
              parseFloat((Math.random() * 2 - 1).toFixed(4)),
              parseFloat((Math.random() * 2 - 1).toFixed(4))
            ],
            stateProbabilities: [
              parseFloat((Math.random()).toFixed(4)),
              parseFloat((Math.random()).toFixed(4)),
              parseFloat((Math.random()).toFixed(4))
            ],
            fidelity: parseFloat((0.8 + Math.random() * 0.2).toFixed(4)),
            quantumAdvantage: parseFloat((Math.random() * 15 + 5).toFixed(2)) + '%'
          }
        }
      }).pipe(delay(800));
    }
    
    return this.http.post<any>(`${this.apiUrl}/quantum/simulate`, params);
  }
} 