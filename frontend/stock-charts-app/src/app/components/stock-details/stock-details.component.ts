import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Observable, finalize, of, switchMap } from 'rxjs';
import { StockData } from '../../models/stock.model';
import { StockService } from '../../services/stock.service';
import { StockChartComponent } from '../stock-chart/stock-chart.component';
import { FormsModule } from '@angular/forms';

// Interfejs wskaźnika technicznego
interface TechnicalIndicator {
  id: string;
  name: string;
  enabled: boolean;
  description: string;
}

@Component({
  selector: 'app-stock-details',
  templateUrl: './stock-details.component.html',
  styleUrls: ['./stock-details.component.scss'],
  standalone: true,
  imports: [CommonModule, StockChartComponent, FormsModule]
})
export class StockDetailsComponent implements OnInit {
  symbol: string = '';
  stockData: StockData | null = null;
  loading: boolean = false;
  error: string | null = null;
  selectedInterval: string = 'daily';
  selectedPeriod: string = '1y';
  selectedChartType: 'candlestick' | 'line' | 'ohlc' = 'candlestick';
  
  // Wskaźniki techniczne
  technicalIndicators: TechnicalIndicator[] = [
    {
      id: 'sma',
      name: 'SMA (Simple Moving Average)',
      enabled: false,
      description: 'Średnia krocząca prosta'
    },
    {
      id: 'ema',
      name: 'EMA (Exponential Moving Average)',
      enabled: false,
      description: 'Wykładnicza średnia krocząca'
    },
    {
      id: 'macd',
      name: 'MACD (Moving Average Convergence Divergence)',
      enabled: false,
      description: 'Zbieżność/Rozbieżność Średnich Kroczących'
    },
    {
      id: 'rsi',
      name: 'RSI (Relative Strength Index)',
      enabled: false,
      description: 'Wskaźnik Relatywnej Siły'
    },
    {
      id: 'bb',
      name: 'Bollinger Bands',
      enabled: false,
      description: 'Wstęgi Bollingera'
    }
  ];

  constructor(
    private route: ActivatedRoute,
    private stockService: StockService
  ) { }

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const symbol = params.get('symbol');
      if (symbol) {
        this.symbol = symbol;
        this.loadStockData();
      }
    });
  }

  loadStockData(): void {
    this.loading = true;
    this.error = null;
    
    this.stockService.getStockData(
      this.symbol,
      this.selectedInterval,
      this.selectedPeriod
    ).pipe(
      finalize(() => {
        this.loading = false;
      })
    ).subscribe({
      next: (response) => {
        if (response.status === 'success' && response.data) {
          this.stockData = response.data;
        } else {
          this.error = response.message || 'Błąd podczas pobierania danych';
        }
      },
      error: (err) => {
        this.error = err.message || 'Wystąpił błąd podczas komunikacji z serwerem';
      }
    });
  }

  changeInterval(interval: string): void {
    this.selectedInterval = interval;
    this.loadStockData();
  }

  changePeriod(period: string): void {
    this.selectedPeriod = period;
    this.loadStockData();
  }
  
  changeChartType(type: 'candlestick' | 'line' | 'ohlc'): void {
    this.selectedChartType = type;
  }
  
  // Funkcja do włączania/wyłączania wskaźnika technicznego
  toggleIndicator(indicatorId: string): void {
    const indicator = this.technicalIndicators.find(ind => ind.id === indicatorId);
    if (indicator) {
      indicator.enabled = !indicator.enabled;
      console.log(`Wskaźnik ${indicator.name} ${indicator.enabled ? 'włączony' : 'wyłączony'}`);
      
      // Po włączeniu wskaźnika wyślij go do komponentu wykresu
      // Komponent wykresu sam wykryje zmianę i pobierze dane
      const stockChartElement = document.querySelector('app-stock-chart');
      if (stockChartElement) {
        // Wywołaj event zmiany żeby zainicjować odświeżenie
        console.log('Propagowanie zmiany wskaźników do komponentu wykresu');
        
        // Wymusimy odświeżenie poprzez stworzenie kopii tablicy wskaźników
        this.technicalIndicators = [...this.technicalIndicators];
      }
    }
  }
  
  // Funkcja do odświeżania danych
  refreshData(): void {
    console.log('Odświeżanie danych...');
    this.loadStockData();
  }
} 