import { Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StockData, StockPrice } from '../../models/stock.model';
import * as Highcharts from 'highcharts/highstock';
import { Options, YAxisOptions } from 'highcharts';
import { HighchartsChartModule } from 'highcharts-angular';
import { StockService } from '../../services/stock.service';
import { forkJoin, Observable, of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';

// Dodajemy interfejs dla wskaźników technicznych
interface TechnicalIndicator {
  id: string;
  name: string;
  enabled: boolean;
  description: string;
}

@Component({
  selector: 'app-stock-chart',
  templateUrl: './stock-chart.component.html',
  styleUrls: ['./stock-chart.component.scss'],
  standalone: true,
  imports: [CommonModule, HighchartsChartModule]
})
export class StockChartComponent implements OnInit, OnChanges {
  @Input() stockData: StockData | null = null;
  @Input() chartType: 'candlestick' | 'line' | 'ohlc' = 'candlestick';
  @Input() technicalIndicators: TechnicalIndicator[] = [];

  Highcharts: typeof Highcharts = Highcharts;
  chartOptions: Options = {};
  chartInstance: Highcharts.Chart | null = null;
  indicatorData: {[key: string]: any} = {}; // Dodajemy przechowywanie danych wskaźników

  constructor(private stockService: StockService) { }

  ngOnInit(): void {
    console.log('Inicjalizacja komponentu wykresu');
    this.updateChart();
  }

  ngOnChanges(changes: SimpleChanges): void {
    console.log('Wykryto zmiany w propsach komponentu:', Object.keys(changes));
    
    // Jeśli zmieniły się dane akcji
    if (changes['stockData']) {
      console.log('Zmieniono dane akcji');
      // Jeśli mamy dane akcji, pobierz dane wskaźników
      if (this.stockData && this.stockData.symbol) {
        this.loadTechnicalIndicatorsData();
      }
    }
    
    // Jeśli zmienił się typ wykresu
    if (changes['chartType']) {
      console.log('Zmieniono typ wykresu na:', this.chartType);
      // Aktualizujemy wykres za każdym razem gdy zmienia się typ
      this.updateChart();
    }
    
    // Jeśli zmieniły się wskaźniki
    if (changes['technicalIndicators']) {
      console.log('Zmieniono wskaźniki techniczne:', this.technicalIndicators);
      
      // Sprawdź, czy włączono nowe wskaźniki
      const enabledIndicators = this.technicalIndicators.filter(ind => ind.enabled);
      console.log('Aktywne wskaźniki:', enabledIndicators.map(ind => ind.id));
      
      // Jeśli mamy symbol i aktywne wskaźniki, pobierz dane
      if (this.stockData && this.stockData.symbol && enabledIndicators.length > 0) {
        this.loadTechnicalIndicatorsData();
      } else {
        // Bez aktywnych wskaźników po prostu aktualizujemy wykres
        this.updateChart();
      }
    }
  }

  // Dodajemy nową metodę do pobierania danych wskaźników technicznych z backendu
  loadTechnicalIndicatorsData(): void {
    if (!this.stockData || !this.stockData.symbol) {
      console.warn('Brak symbolu akcji, nie można pobrać danych wskaźników');
      return;
    }
    
    const symbol = this.stockData.symbol;
    const enabledIndicators = this.technicalIndicators.filter(ind => ind.enabled);
    
    if (enabledIndicators.length === 0) {
      console.log('Brak aktywnych wskaźników do pobrania');
      return;
    }
    
    console.log('Pobieranie danych wskaźników dla:', symbol, enabledIndicators);
    
    // Przygotuj mapę z parametrami dla każdego wskaźnika
    const indicatorParams: {[key: string]: any} = {
      'sma': { period: 14 },
      'ema': { period: 14 },
      'macd': { fastPeriod: 12, slowPeriod: 26, signalPeriod: 9 },
      'rsi': { period: 14 },
      'bb': { period: 20, stdDev: 2 }
    };
    
    // Stwórz tablicę zapytań do wykonania
    const indicatorRequests: Observable<any>[] = enabledIndicators.map(indicator => {
      console.log(`Wywołanie usługi dla wskaźnika ${indicator.id} z parametrami:`, indicatorParams[indicator.id]);
      
      return this.stockService.getTechnicalIndicatorData(
        symbol, 
        indicator.id, 
        indicatorParams[indicator.id]
      ).pipe(
        tap(response => {
          console.log(`Otrzymano odpowiedź dla wskaźnika ${indicator.id}:`, response);
          
          if (response.status === 'success' && response.data) {
            console.log(`Pobrano dane dla wskaźnika ${indicator.id}:`, response.data);
            this.indicatorData[indicator.id] = response.data;
          } else {
            console.warn(`Błąd podczas pobierania danych dla wskaźnika ${indicator.id}:`, response.message);
          }
        }),
        catchError(error => {
          console.error(`Błąd podczas pobierania danych wskaźnika ${indicator.id}:`, error);
          return of(null);
        })
      );
    });
    
    // Wykonaj wszystkie zapytania równolegle
    forkJoin(indicatorRequests)
      .pipe(
        catchError(error => {
          console.error('Błąd podczas pobierania danych wskaźników:', error);
          return of([]);
        })
      )
      .subscribe(results => {
        console.log('Zakończono pobieranie danych wskaźników, otrzymane wyniki:', results);
        console.log('Zapisane dane wskaźników:', this.indicatorData);
        this.updateChart(); // Aktualizuj wykres po pobraniu danych
      });
  }

  updateChart(): void {
    console.log('Aktualizacja wykresu - technicalIndicators:', this.technicalIndicators);
    
    // Tworzymy podstawową konfigurację osi Y
    const yAxis: any[] = [
      {
        // Główna oś dla cen
        height: '60%',
        lineWidth: 2,
        resize: {
          enabled: true
        }
      }
    ];
    
    // Dodajemy osie dla wskaźników, jeśli są aktywne
    const hasMacd = this.technicalIndicators.some(ind => ind.id === 'macd' && ind.enabled);
    const hasRsi = this.technicalIndicators.some(ind => ind.id === 'rsi' && ind.enabled);
    
    console.log('Aktywne wskaźniki MACD:', hasMacd, 'RSI:', hasRsi);
    
    // Dostosowujemy wysokości osi
    let macdHeight = '20%';
    let rsiHeight = '15%';
    let macdTop = '65%';
    let rsiTop = '85%';
    
    if (hasMacd && !hasRsi) {
      macdHeight = '40%';
    } else if (!hasMacd && hasRsi) {
      rsiHeight = '40%';
      rsiTop = '65%';
    }
    
    if (hasMacd) {
      yAxis.push({
        // Oś dla MACD
        top: macdTop,
        height: macdHeight,
        offset: 0,
        lineWidth: 2,
        title: {
          text: 'MACD',
          style: {
            color: '#4285F4'
          }
        }
      });
    }
    
    if (hasRsi) {
      yAxis.push({
        // Oś dla RSI
        top: rsiTop,
        height: rsiHeight,
        offset: 0,
        lineWidth: 2,
        title: {
          text: 'RSI',
          style: {
            color: '#673AB7'
          }
        },
        plotLines: [{
          value: 30,
          color: '#E57373',
          width: 1,
          zIndex: 5
        }, {
          value: 70,
          color: '#81C784',
          width: 1,
          zIndex: 5
        }],
        min: 0,
        max: 100
      });
    }
    
    const mainSeries = {
      type: this.chartType,
      name: this.stockData?.symbol || 'Akcje',
      id: 'main',
      data: this.formatChartData(),
      tooltip: {
        valueDecimals: 2
      }
    };
    
    console.log('Generowanie serii wskaźników');
    const indicatorSeries = this.generateTechnicalIndicatorsSeries();
    console.log('Wygenerowane serie wskaźników:', indicatorSeries.length);
    
    // Aktualizacja opcji wykresu
    this.chartOptions = {
      chart: {
        type: this.chartType,
        height: 500
      },
      title: {
        text: this.stockData ? `${this.stockData.symbol} - ${this.stockData.name || ''}` : 'Wykres akcji'
      },
      rangeSelector: {
        selected: 1,
        buttons: [
          {
            type: 'day',
            count: 7,
            text: '7d'
          },
          {
            type: 'month',
            count: 1,
            text: '1m'
          },
          {
            type: 'month',
            count: 3,
            text: '3m'
          },
          {
            type: 'month',
            count: 6,
            text: '6m'
          },
          {
            type: 'year',
            count: 1,
            text: '1r'
          },
          {
            type: 'all',
            text: 'Wszystko'
          }
        ]
      },
      // Używamy dynamicznie wygenerowanej konfiguracji osi
      yAxis: yAxis,
      series: [
        mainSeries,
        ...indicatorSeries
      ],
      credits: {
        enabled: false
      }
    };
    
    console.log('Opcje wykresu zaktualizowane:', {
      chartType: this.chartType,
      mainSeriesPoints: mainSeries.data.length,
      indicatorSeries: indicatorSeries.length,
      yAxisCount: yAxis.length
    });
  }

  formatChartData(): any[] {
    if (!this.stockData || !this.stockData.prices || this.stockData.prices.length === 0) {
      return [];
    }

    return this.stockData.prices.map((price: StockPrice) => {
      const timestamp = new Date(price.timestamp).getTime();
      
      if (this.chartType === 'line') {
        return [timestamp, price.close];
      } else {
        return [
          timestamp,
          price.open,
          price.high,
          price.low,
          price.close
        ];
      }
    });
  }

  changeChartType(type: 'candlestick' | 'line' | 'ohlc'): void {
    this.chartType = type;
    this.updateChart();
  }
  
  // Metoda generująca serie danych dla wskaźników technicznych
  generateTechnicalIndicatorsSeries(): any[] {
    if (!this.stockData || !this.stockData.prices || this.stockData.prices.length === 0) {
      console.warn('Brak danych dla wskaźników technicznych');
      return [];
    }
    
    const series: any[] = [];
    const prices = this.stockData.prices;
    
    // Identyfikujemy aktywne wskaźniki
    const hasMacd = this.technicalIndicators.some(ind => ind.id === 'macd' && ind.enabled);
    const hasRsi = this.technicalIndicators.some(ind => ind.id === 'rsi' && ind.enabled);
    
    // Ustalamy indeksy osi Y dla wskaźników
    let macdAxisIndex = 1;
    let rsiAxisIndex = hasMacd ? 2 : 1;
    
    console.log('Generowanie serii wskaźników technicznych');
    console.log('Dostępne dane wskaźników:', this.indicatorData);
    
    try {
      this.technicalIndicators.forEach(indicator => {
        if (!indicator.enabled) return;
        
        console.log(`Generowanie wskaźnika ${indicator.name} (${indicator.id})`);
        
        // Sprawdźmy, czy mamy dane z backendu
        const backendData = this.indicatorData[indicator.id];
        console.log(`Dane backendu dla ${indicator.id}:`, backendData);
        
        switch (indicator.id) {
          case 'sma':
            if (backendData) {
              // Użyj danych z backendu
              const smaData = this.formatIndicatorData(backendData);
              if (smaData && smaData.length > 0) {
                series.push({
                  type: 'line',
                  name: `SMA (${backendData.params?.period || 14})`,
                  data: smaData,
                  tooltip: {
                    valueDecimals: 2
                  },
                  color: '#4285F4',
                  lineWidth: 1.5
                });
                console.log('Użyto danych SMA z backendu:', smaData.length, 'punktów');
              } else {
                console.warn('Nieprawidłowe dane SMA z backendu');
              }
            } else {
              // Użyj obliczeń lokalnych jako backup
              const sma = this.calculateSMA(prices, 14);
              if (sma) series.push(sma);
              console.log('Użyto lokalnie obliczonych danych SMA');
            }
            break;
          case 'ema':
            if (backendData) {
              // Użyj danych z backendu
              const emaData = this.formatIndicatorData(backendData);
              if (emaData && emaData.length > 0) {
                series.push({
                  type: 'line',
                  name: `EMA (${backendData.params?.period || 14})`,
                  data: emaData,
                  tooltip: {
                    valueDecimals: 2
                  },
                  color: '#EA4335',
                  lineWidth: 1.5
                });
                console.log('Użyto danych EMA z backendu:', emaData.length, 'punktów');
              } else {
                console.warn('Nieprawidłowe dane EMA z backendu');
              }
            } else {
              // Użyj obliczeń lokalnych jako backup
              const ema = this.calculateEMA(prices, 14);
              if (ema) series.push(ema);
              console.log('Użyto lokalnie obliczonych danych EMA');
            }
            break;
          case 'macd':
            if (backendData && backendData.macdLine && backendData.signalLine && backendData.histogram) {
              // Użyj danych MACD z backendu
              console.log('Formatowanie danych MACD z backendu');
              
              const macdLine = this.formatIndicatorData(backendData.macdLine);
              const signalLine = this.formatIndicatorData(backendData.signalLine);
              const histogram = this.formatIndicatorData(backendData.histogram);
              
              console.log('Dane MACD po konwersji:', {
                macdLine: macdLine.length,
                signalLine: signalLine.length, 
                histogram: histogram.length
              });
              
              if (macdLine.length > 0 && signalLine.length > 0 && histogram.length > 0) {
                series.push({
                  type: 'line',
                  name: 'MACD',
                  data: macdLine,
                  yAxis: macdAxisIndex,
                  color: '#2962FF',
                  lineWidth: 1.5
                });
                
                series.push({
                  type: 'line',
                  name: 'Signal',
                  data: signalLine,
                  yAxis: macdAxisIndex,
                  color: '#FF6D00',
                  lineWidth: 1.5
                });
                
                series.push({
                  type: 'column',
                  name: 'Histogram',
                  data: histogram,
                  yAxis: macdAxisIndex,
                  color: '#673AB7',
                  negativeColor: '#00BCD4'
                });
                
                console.log('Użyto danych MACD z backendu');
              } else {
                console.warn('Nieprawidłowe dane MACD z backendu');
                
                // Użyj obliczeń lokalnych jako backup w przypadku problemu
                const macdSeries = this.calculateMACD(prices, macdAxisIndex);
                if (macdSeries && macdSeries.length > 0) series.push(...macdSeries);
                console.log('Użyto lokalnie obliczonych danych MACD (po niepowodzeniu z backendem)');
              }
            } else {
              // Użyj obliczeń lokalnych jako backup
              const macdSeries = this.calculateMACD(prices, macdAxisIndex);
              if (macdSeries && macdSeries.length > 0) series.push(...macdSeries);
              console.log('Użyto lokalnie obliczonych danych MACD');
            }
            break;
          case 'rsi':
            if (backendData) {
              // Użyj danych RSI z backendu
              const rsiData = this.formatIndicatorData(backendData);
              if (rsiData && rsiData.length > 0) {
                series.push({
                  type: 'line',
                  name: 'RSI',
                  data: rsiData,
                  yAxis: rsiAxisIndex,
                  tooltip: {
                    valueDecimals: 2
                  },
                  color: '#673AB7',
                  lineWidth: 1.5
                });
                console.log('Użyto danych RSI z backendu:', rsiData.length, 'punktów');
              } else {
                console.warn('Nieprawidłowe dane RSI z backendu');
              }
            } else {
              // Użyj obliczeń lokalnych jako backup
              const rsi = this.calculateRSI(prices, 14, rsiAxisIndex);
              if (rsi) series.push(rsi);
              console.log('Użyto lokalnie obliczonych danych RSI');
            }
            break;
          case 'bb':
            if (backendData && backendData.upperBand && backendData.middleBand && backendData.lowerBand) {
              // Użyj danych Wstęg Bollingera z backendu
              console.log('Formatowanie danych Bollinger Bands z backendu');
              
              const upperBand = this.formatIndicatorData(backendData.upperBand);
              const middleBand = this.formatIndicatorData(backendData.middleBand);
              const lowerBand = this.formatIndicatorData(backendData.lowerBand);
              
              console.log('Dane Bollinger Bands po konwersji:', {
                upper: upperBand.length,
                middle: middleBand.length,
                lower: lowerBand.length
              });
              
              if (upperBand.length > 0 && middleBand.length > 0 && lowerBand.length > 0) {
                series.push({
                  type: 'line',
                  name: 'Górna wstęga',
                  data: upperBand,
                  color: '#43A047',
                  lineWidth: 1
                });
                
                series.push({
                  type: 'line',
                  name: 'Środkowa wstęga (SMA)',
                  data: middleBand,
                  color: '#3949AB',
                  lineWidth: 1
                });
                
                series.push({
                  type: 'line',
                  name: 'Dolna wstęga',
                  data: lowerBand,
                  color: '#E53935',
                  lineWidth: 1
                });
                
                // Dodajemy obszar wypełnienia między górnymi i dolnymi wstęgami
                try {
                  const areaData = upperBand.map((point, index) => {
                    if (!lowerBand[index]) {
                      console.warn(`Brak punktu w lowerBand dla indeksu ${index}`);
                      return null;
                    }
                    return [
                      point[0], // timestamp
                      lowerBand[index][1], // dolna granica
                      point[1] // górna granica
                    ];
                  }).filter(point => point !== null);
                  
                  if (areaData.length > 0) {
                    series.push({
                      type: 'arearange',
                      name: 'Wstęgi Bollingera',
                      data: areaData,
                      lineWidth: 0,
                      color: 'transparent',
                      fillColor: {
                        linearGradient: {
                          x1: 0,
                          y1: 0,
                          x2: 0,
                          y2: 1
                        },
                        stops: [
                          [0, Highcharts.color('#43A047').setOpacity(0.2).get()],
                          [1, Highcharts.color('#E53935').setOpacity(0.2).get()]
                        ]
                      },
                      zIndex: -1,
                      marker: { enabled: false }
                    });
                  }
                } catch (error) {
                  console.error('Błąd podczas tworzenia obszaru Bollinger Bands:', error);
                }
                
                console.log('Użyto danych Wstęg Bollingera z backendu');
              } else {
                console.warn('Nieprawidłowe dane Wstęg Bollingera z backendu');
              }
            } else {
              // Użyj obliczeń lokalnych jako backup
              const bbSeries = this.calculateBollingerBands(prices, 20, 2);
              if (bbSeries && bbSeries.length > 0) series.push(...bbSeries);
              console.log('Użyto lokalnie obliczonych danych Wstęg Bollingera');
            }
            break;
        }
      });
    } catch (error) {
      console.error('Błąd podczas generowania wskaźników technicznych:', error);
    }
    
    console.log('Wygenerowano serie wskaźników:', series.length);
    return series;
  }
  
  // Pomocnicza metoda do formatowania danych wskaźników z backendu
  formatIndicatorData(data: any[]): any[] {
    console.log('Formatowanie danych wskaźnika:', data);
    
    if (!data || !Array.isArray(data)) {
      console.warn('Nieprawidłowe dane wskaźnika:', data);
      return [];
    }
    
    const formattedData = data.map(point => {
      if (Array.isArray(point)) {
        // Dane już są w formacie [timestamp, value]
        console.log('Punkt w formacie tablicy:', point);
        return point;
      } else if (point.timestamp !== undefined && point.value !== undefined) {
        // Dane są w formacie {timestamp: number, value: number}
        console.log('Punkt w formacie obiektu timestamp/value:', point);
        const timestamp = typeof point.timestamp === 'string' ? 
                         new Date(point.timestamp).getTime() : 
                         point.timestamp;
        return [timestamp, point.value];
      } else if (point.date !== undefined && point.value !== undefined) {
        // Dane są w formacie {date: string, value: number}
        console.log('Punkt w formacie obiektu date/value:', point);
        return [new Date(point.date).getTime(), point.value];
      } else {
        console.warn('Nieznany format danych wskaźnika:', point);
        return null;
      }
    }).filter(point => point !== null);
    
    console.log('Sformatowane dane:', formattedData);
    return formattedData;
  }
  
  // Implementacja wskaźników technicznych
  
  // SMA - Simple Moving Average (Średnia krocząca prosta)
  calculateSMA(prices: StockPrice[], period: number): any {
    // Sprawdzamy, czy mamy wystarczającą ilość danych
    if (!prices || prices.length < period) {
      console.warn('Niewystarczająca liczba punktów danych dla SMA');
      return null;
    }
    
    const data: any[] = [];
    
    try {
      for (let i = period - 1; i < prices.length; i++) {
        let sum = 0;
        let validPoints = 0;
        
        for (let j = 0; j < period; j++) {
          if (prices[i - j] && typeof prices[i - j].close === 'number') {
            sum += prices[i - j].close;
            validPoints++;
          }
        }
        
        // Sprawdzamy, czy mamy wystarczająco punktów do obliczenia średniej
        if (validPoints < period * 0.8) { // Wymagamy co najmniej 80% ważnych punktów
          console.warn(`Niewystarczająca liczba ważnych punktów dla SMA na indeksie ${i}`);
          continue;
        }
        
        const sma = sum / validPoints;
        
        if (prices[i] && prices[i].timestamp) {
          const timestamp = new Date(prices[i].timestamp).getTime();
          data.push([timestamp, sma]);
        }
      }
      
      // Sprawdzamy, czy mamy jakiekolwiek dane do wyświetlenia
      if (data.length === 0) {
        console.warn('Brak danych do wyświetlenia dla SMA');
        return null;
      }
      
      return {
        type: 'line',
        name: `SMA (${period})`,
        data: data,
        tooltip: {
          valueDecimals: 2
        },
        color: '#4285F4',
        lineWidth: 1.5
      };
    } catch (error) {
      console.error('Błąd podczas obliczania SMA:', error);
      return null;
    }
  }
  
  // EMA - Exponential Moving Average (Wykładnicza średnia krocząca)
  calculateEMA(prices: StockPrice[], period: number): any {
    // Sprawdzamy, czy mamy wystarczającą ilość danych
    if (!prices || prices.length < period) {
      console.warn('Niewystarczająca liczba punktów danych dla EMA');
      return null;
    }
    
    const data: any[] = [];
    
    try {
      const multiplier = 2 / (period + 1);
      
      // Najpierw obliczamy SMA dla pierwszego okresu
      let sum = 0;
      let validPoints = 0;
      
      for (let i = 0; i < period; i++) {
        if (prices[i] && typeof prices[i].close === 'number') {
          sum += prices[i].close;
          validPoints++;
        }
      }
      
      // Sprawdzamy, czy mamy wystarczająco punktów do obliczenia średniej
      if (validPoints < period * 0.8) { // Wymagamy co najmniej 80% ważnych punktów
        console.warn('Niewystarczająca liczba ważnych punktów dla początkowej SMA w EMA');
        return null;
      }
      
      let ema = sum / validPoints;
      
      // Pierwszy punkt to SMA
      if (prices[period - 1] && prices[period - 1].timestamp) {
        const firstTimestamp = new Date(prices[period - 1].timestamp).getTime();
        data.push([firstTimestamp, ema]);
      } else {
        console.warn('Brak danych timestamp dla pierwszego punktu EMA');
        return null;
      }
      
      // Następnie obliczamy EMA dla kolejnych dni
      for (let i = period; i < prices.length; i++) {
        if (prices[i] && typeof prices[i].close === 'number' && prices[i].timestamp) {
          ema = (prices[i].close - ema) * multiplier + ema;
          const timestamp = new Date(prices[i].timestamp).getTime();
          data.push([timestamp, ema]);
        }
      }
      
      // Sprawdzamy, czy mamy jakiekolwiek dane do wyświetlenia
      if (data.length <= 1) { // Potrzebujemy więcej niż tylko pierwszy punkt
        console.warn('Niewystarczająca liczba punktów danych dla EMA');
        return null;
      }
      
      return {
        type: 'line',
        name: `EMA (${period})`,
        data: data,
        tooltip: {
          valueDecimals: 2
        },
        color: '#EA4335',
        lineWidth: 1.5
      };
    } catch (error) {
      console.error('Błąd podczas obliczania EMA:', error);
      return null;
    }
  }
  
  // Helper dla obliczania danych EMA (bez formatowania w serię)
  calculateEMAData(prices: StockPrice[], period: number): number[] {
    const emaData: number[] = [];
    
    // Sprawdzamy, czy mamy wystarczającą ilość danych
    if (!prices || prices.length < period) {
      console.warn('Niewystarczająca liczba punktów danych dla EMA');
      return [];
    }
    
    const multiplier = 2 / (period + 1);
    
    // Najpierw obliczamy SMA dla pierwszego okresu
    let sum = 0;
    for (let i = 0; i < period; i++) {
      if (prices[i] && typeof prices[i].close === 'number') {
        sum += prices[i].close;
      } else {
        console.warn(`Brak danych dla EMA na indeksie ${i}`);
        return []; // Zwracamy pustą tablicę, jeśli brakuje danych
      }
    }
    let ema = sum / period;
    emaData.push(ema);
    
    // Następnie obliczamy EMA dla kolejnych dni
    for (let i = period; i < prices.length; i++) {
      if (prices[i] && typeof prices[i].close === 'number') {
        ema = (prices[i].close - ema) * multiplier + ema;
        emaData.push(ema);
      } else {
        console.warn(`Brak danych dla EMA na indeksie ${i}`);
        // Kontynuujemy z poprzednią wartością EMA
        emaData.push(ema);
      }
    }
    
    return emaData;
  }
  
  // MACD - Moving Average Convergence Divergence
  calculateMACD(prices: StockPrice[], yAxisIndex: number = 1): any[] {
    // Sprawdzamy, czy mamy wystarczającą ilość danych
    if (!prices || prices.length < 26) {  // 26 to najdłuższy okres w MACD
      console.warn('Niewystarczająca liczba punktów danych dla MACD');
      return [];
    }
    
    // Parametry MACD: szybka EMA (12), wolna EMA (26), sygnał EMA (9)
    const fastPeriod = 12;
    const slowPeriod = 26;
    const signalPeriod = 9;
    
    try {
      // Obliczamy EMA dla szybkiego i wolnego okresu
      const fastEMA = this.calculateEMAData(prices, fastPeriod);
      const slowEMA = this.calculateEMAData(prices, slowPeriod);
      
      // Sprawdzamy, czy uzyskaliśmy dane
      if (fastEMA.length === 0 || slowEMA.length === 0) {
        console.warn('Nie udało się obliczyć EMA dla MACD');
        return [];
      }
      
      // Obliczamy linię MACD (różnica między szybką a wolną EMA)
      const macdLine: any[] = [];
      const histogramData: any[] = [];
      
      // Znajdujemy wspólne punkty czasowe dla obu EMA
      const startIndex = Math.max(fastPeriod, slowPeriod) - 1;
      
      for (let i = startIndex; i < prices.length; i++) {
        if (!prices[i] || !prices[i].timestamp) {
          console.warn(`Brak danych timestamp dla MACD na indeksie ${i}`);
          continue;
        }
        
        const timestamp = new Date(prices[i].timestamp).getTime();
        const fastIndex = i - fastPeriod + 1;
        const slowIndex = i - slowPeriod + 1;
        
        if (fastIndex >= 0 && slowIndex >= 0 && 
            fastIndex < fastEMA.length && slowIndex < slowEMA.length) {
          const fastValue = fastEMA[fastIndex];
          const slowValue = slowEMA[slowIndex];
          
          if (typeof fastValue === 'number' && typeof slowValue === 'number') {
            const macdValue = fastValue - slowValue;
            macdLine.push([timestamp, macdValue]);
          }
        }
      }
      
      // Sprawdzamy, czy mamy wystarczające dane dla linii MACD
      if (macdLine.length < signalPeriod) {
        console.warn('Niewystarczająca liczba punktów danych dla linii sygnału MACD');
        return [];
      }
      
      // Obliczamy linię sygnału (EMA z linii MACD)
      const signalLine: any[] = [];
      let macdSum = 0;
      
      // Najpierw obliczamy SMA dla pierwszego okresu sygnału
      for (let i = 0; i < signalPeriod; i++) {
        if (macdLine[i] && typeof macdLine[i][1] === 'number') {
          macdSum += macdLine[i][1];
        } else {
          console.warn(`Brak danych dla sygnału MACD na indeksie ${i}`);
          return []; // Brakuje danych, nie możemy kontynuować
        }
      }
      
      let signalEMA = macdSum / signalPeriod;
      signalLine.push([macdLine[signalPeriod - 1][0], signalEMA]);
      
      // Następnie obliczamy EMA dla pozostałych punktów
      const multiplier = 2 / (signalPeriod + 1);
      
      for (let i = signalPeriod; i < macdLine.length; i++) {
        if (macdLine[i] && typeof macdLine[i][1] === 'number') {
          signalEMA = (macdLine[i][1] - signalEMA) * multiplier + signalEMA;
          signalLine.push([macdLine[i][0], signalEMA]);
          
          // Obliczamy histogram (różnica między linią MACD a linią sygnału)
          const histogram = macdLine[i][1] - signalEMA;
          histogramData.push({
            x: macdLine[i][0],
            y: histogram,
            color: histogram >= 0 ? '#34A853' : '#EA4335'
          });
        } else {
          console.warn(`Brak danych dla sygnału MACD przy obliczaniu histogramu na indeksie ${i}`);
        }
      }
      
      return [
        {
          type: 'line',
          name: 'MACD',
          data: macdLine.slice(signalPeriod - 1),
          tooltip: {
            valueDecimals: 2
          },
          color: '#4285F4',
          lineWidth: 1.5,
          yAxis: yAxisIndex
        },
        {
          type: 'line',
          name: 'Sygnał',
          data: signalLine,
          tooltip: {
            valueDecimals: 2
          },
          color: '#FBBC05',
          lineWidth: 1.5,
          yAxis: yAxisIndex
        },
        {
          type: 'column',
          name: 'Histogram',
          data: histogramData,
          tooltip: {
            valueDecimals: 2
          },
          yAxis: yAxisIndex
        }
      ];
    } catch (error) {
      console.error('Błąd podczas obliczania MACD:', error);
      return [];
    }
  }
  
  // RSI - Relative Strength Index (Wskaźnik Relatywnej Siły)
  calculateRSI(prices: StockPrice[], period: number, yAxisIndex: number = 2): any {
    // Sprawdzamy, czy mamy wystarczającą ilość danych
    if (!prices || prices.length <= period + 1) {
      console.warn('Niewystarczająca liczba punktów danych dla RSI');
      return null;
    }
    
    const data: any[] = [];
    const gains: number[] = [];
    const losses: number[] = [];
    
    // Obliczamy początkowe zyski i straty
    for (let i = 1; i < prices.length; i++) {
      if (prices[i-1] && prices[i] && 
          typeof prices[i-1].close === 'number' && 
          typeof prices[i].close === 'number') {
        const change = prices[i].close - prices[i - 1].close;
        gains.push(change > 0 ? change : 0);
        losses.push(change < 0 ? Math.abs(change) : 0);
      } else {
        console.warn(`Brak danych dla RSI między indeksami ${i-1} i ${i}`);
        gains.push(0);
        losses.push(0);
      }
    }
    
    // Sprawdzamy, czy mamy wystarczająco danych
    if (gains.length < period || losses.length < period) {
      console.warn('Niewystarczająca liczba punktów danych dla RSI po walidacji');
      return null;
    }
    
    // Obliczamy średnie zyski i straty dla pierwszego okresu
    let avgGain = gains.slice(0, period).reduce((sum, value) => sum + value, 0) / period;
    let avgLoss = losses.slice(0, period).reduce((sum, value) => sum + value, 0) / period;
    
    // Obliczamy RSI dla pierwszego punktu
    let rs = avgGain / (avgLoss === 0 ? 0.01 : avgLoss); // Unikamy dzielenia przez zero
    let rsi = 100 - (100 / (1 + rs));
    
    if (prices[period] && prices[period].timestamp) {
      const timestamp = new Date(prices[period].timestamp).getTime();
      data.push([timestamp, rsi]);
    }
    
    // Obliczamy RSI dla pozostałych punktów przy użyciu wygładzania
    for (let i = period; i < prices.length - 1; i++) {
      avgGain = ((avgGain * (period - 1)) + gains[i]) / period;
      avgLoss = ((avgLoss * (period - 1)) + losses[i]) / period;
      
      rs = avgGain / (avgLoss === 0 ? 0.01 : avgLoss);
      rsi = 100 - (100 / (1 + rs));
      
      if (prices[i + 1] && prices[i + 1].timestamp) {
        const timestamp = new Date(prices[i + 1].timestamp).getTime();
        data.push([timestamp, rsi]);
      }
    }
    
    // Sprawdzamy, czy mamy jakiekolwiek dane do wyświetlenia
    if (data.length === 0) {
      console.warn('Brak danych do wyświetlenia dla RSI');
      return null;
    }
    
    return {
      type: 'line',
      name: 'RSI',
      data: data,
      tooltip: {
        valueDecimals: 2
      },
      color: '#673AB7',
      lineWidth: 1.5,
      yAxis: yAxisIndex
    };
  }
  
  // Bollinger Bands (Wstęgi Bollingera)
  calculateBollingerBands(prices: StockPrice[], period: number, deviation: number): any[] {
    // Sprawdzamy, czy mamy wystarczającą ilość danych
    if (!prices || prices.length < period) {
      console.warn('Niewystarczająca liczba punktów danych dla Bollinger Bands');
      return [];
    }
    
    try {
      const middle: any[] = [];
      const upper: any[] = [];
      const lower: any[] = [];
      
      for (let i = period - 1; i < prices.length; i++) {
        let validPoints = 0;
        let sum = 0;
        
        // Sprawdzamy dane do obliczenia SMA
        for (let j = 0; j < period; j++) {
          if (prices[i - j] && typeof prices[i - j].close === 'number') {
            sum += prices[i - j].close;
            validPoints++;
          }
        }
        
        // Sprawdzamy, czy mamy wystarczająco punktów do obliczenia średniej
        if (validPoints < period * 0.8) { // Wymagamy co najmniej 80% ważnych punktów
          console.warn(`Niewystarczająca liczba ważnych punktów dla Bollinger Bands na indeksie ${i}`);
          continue;
        }
        
        const sma = sum / validPoints;
        
        // Obliczamy odchylenie standardowe
        let sumSquared = 0;
        let validSquaredPoints = 0;
        
        for (let j = 0; j < period; j++) {
          if (prices[i - j] && typeof prices[i - j].close === 'number') {
            sumSquared += Math.pow(prices[i - j].close - sma, 2);
            validSquaredPoints++;
          }
        }
        
        if (validSquaredPoints === 0) {
          console.warn(`Brak ważnych punktów dla odchylenia standardowego w Bollinger Bands na indeksie ${i}`);
          continue;
        }
        
        const std = Math.sqrt(sumSquared / validSquaredPoints);
        
        if (prices[i] && prices[i].timestamp) {
          const timestamp = new Date(prices[i].timestamp).getTime();
          middle.push([timestamp, sma]);
          upper.push([timestamp, sma + (deviation * std)]);
          lower.push([timestamp, sma - (deviation * std)]);
        }
      }
      
      // Sprawdzamy, czy mamy jakiekolwiek dane do wyświetlenia
      if (middle.length === 0 || upper.length === 0 || lower.length === 0) {
        console.warn('Brak danych do wyświetlenia dla Bollinger Bands');
        return [];
      }
      
      return [
        {
          type: 'line',
          name: 'Bollinger SMA',
          data: middle,
          tooltip: {
            valueDecimals: 2
          },
          color: '#009688',
          lineWidth: 1.5
        },
        {
          type: 'line',
          name: 'Górna wstęga',
          data: upper,
          tooltip: {
            valueDecimals: 2
          },
          color: '#009688',
          lineWidth: 1,
          dashStyle: 'shortdash'
        },
        {
          type: 'line',
          name: 'Dolna wstęga',
          data: lower,
          tooltip: {
            valueDecimals: 2
          },
          color: '#009688',
          lineWidth: 1,
          dashStyle: 'shortdash'
        }
      ];
    } catch (error) {
      console.error('Błąd podczas obliczania Bollinger Bands:', error);
      return [];
    }
  }
} 