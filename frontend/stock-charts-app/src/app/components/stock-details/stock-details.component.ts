import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Observable, finalize, of, switchMap } from 'rxjs';
import { StockData } from '../../models/stock.model';
import { StockService } from '../../services/stock.service';
import { StockChartComponent } from '../stock-chart/stock-chart.component';

@Component({
  selector: 'app-stock-details',
  templateUrl: './stock-details.component.html',
  styleUrls: ['./stock-details.component.scss'],
  standalone: true,
  imports: [CommonModule, StockChartComponent]
})
export class StockDetailsComponent implements OnInit {
  symbol: string = '';
  stockData: StockData | null = null;
  loading: boolean = false;
  error: string | null = null;
  selectedInterval: string = 'daily';
  selectedPeriod: string = '1y';

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
} 