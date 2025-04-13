import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { StockService } from '../../services/stock.service';
import { StockMetadata, StockData } from '../../models/stock.model';
import { StockChartComponent } from '../stock-chart/stock-chart.component';

interface TechnicalIndicator {
  id: string;
  name: string;
  enabled: boolean;
  description: string;
}

@Component({
  selector: 'app-popular-stocks',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, StockChartComponent],
  templateUrl: './popular-stocks.component.html',
  styleUrls: ['./popular-stocks.component.scss']
})
export class PopularStocksComponent implements OnInit {
  // Lista popularnych akcji
  popularStocks: StockMetadata[] = [
    {
      symbol: 'AAPL',
      name: 'Apple Inc',
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
      name: 'Alphabet Inc',
      type: 'Equity',
      region: 'United States',
      currency: 'USD'
    },
    {
      symbol: 'AMZN',
      name: 'Amazon.com Inc',
      type: 'Equity',
      region: 'United States',
      currency: 'USD'
    },
    {
      symbol: 'AAF.LON',
      name: 'Airtel Africa Plc',
      type: 'Equity',
      region: 'United Kingdom',
      currency: 'GBX'
    },
    {
      symbol: 'AAFRF',
      name: 'Airtel Africa Plc',
      type: 'Equity',
      region: 'United States',
      currency: 'USD'
    }
  ];

  // Lista wskaźników technicznych
  technicalIndicators: TechnicalIndicator[] = [
    { id: 'sma', name: 'SMA (Simple Moving Average)', enabled: false, description: 'Średnia krocząca prosta' },
    { id: 'ema', name: 'EMA (Exponential Moving Average)', enabled: false, description: 'Wykładnicza średnia krocząca' },
    { id: 'macd', name: 'MACD (Moving Average Convergence Divergence)', enabled: false, description: 'Zbieżność/Rozbieżność Średnich Kroczących' },
    { id: 'rsi', name: 'RSI (Relative Strength Index)', enabled: false, description: 'Wskaźnik Relatywnej Siły' },
    { id: 'bb', name: 'Bollinger Bands', enabled: false, description: 'Wstęgi Bollingera' }
  ];

  // Aktualnie wybrany symbol
  selectedStock: StockMetadata | null = null;
  
  // Dane dla wybranej akcji
  stockData: StockData | null = null;
  
  // Stan ładowania
  loading = false;
  
  // Komunikat o błędzie
  error: string | null = null;

  constructor(private stockService: StockService) { }

  ngOnInit(): void {
    // Domyślnie wybieramy pierwszą akcję z listy
    if (this.popularStocks.length > 0) {
      this.selectStock(this.popularStocks[0]);
    }
  }

  selectStock(stock: StockMetadata): void {
    this.selectedStock = stock;
    this.loadStockData();
  }

  loadStockData(): void {
    if (!this.selectedStock) {
      return;
    }

    this.loading = true;
    this.error = null;

    this.stockService.getStockData(this.selectedStock.symbol, 'daily', '1m')
      .subscribe({
        next: response => {
          if (response && response.data) {
            this.stockData = response.data;
          } else {
            this.error = 'Nie udało się pobrać danych dla wybranej akcji.';
          }
          this.loading = false;
        },
        error: err => {
          this.error = 'Wystąpił błąd podczas komunikacji z serwerem.';
          this.loading = false;
        }
      });
  }

  toggleIndicator(indicator: TechnicalIndicator): void {
    indicator.enabled = !indicator.enabled;
    console.log(`Wskaźnik ${indicator.name} jest teraz ${indicator.enabled ? 'włączony' : 'wyłączony'}`);
    console.log('Aktualna lista wskaźników:', JSON.stringify(this.technicalIndicators));
    
    // Aby wymusić odświeżenie widoku, możemy utworzyć nową referencję dla tablicy
    this.technicalIndicators = [...this.technicalIndicators];
  }
  
  // Metoda do ręcznego odświeżania danych (do celów testowych)
  testLoadData(): void {
    if (!this.selectedStock) {
      console.warn('Nie wybrano akcji do odświeżenia');
      return;
    }
    
    console.log('Ręczne pobieranie danych dla:', this.selectedStock.symbol);
    
    // Dodajemy timestamp do zapytania, aby uniknąć cachowania po stronie serwera
    const now = new Date().toISOString();
    
    this.stockService.getStockData(this.selectedStock.symbol, 'daily', '1m', now)
      .subscribe({
        next: response => {
          console.log('Otrzymane dane:', response);
          if (response && response.data) {
            this.stockData = response.data;
            console.log('Liczba punktów danych:', this.stockData.prices.length);
            
            // Sprawdźmy kilka pierwszych punktów danych
            if (this.stockData.prices.length > 0) {
              console.log('Przykładowe punkty danych:', this.stockData.prices.slice(0, 5));
            }
          } else {
            console.error('Brak danych w odpowiedzi:', response);
          }
        },
        error: err => {
          console.error('Błąd podczas pobierania danych:', err);
        }
      });
  }
} 