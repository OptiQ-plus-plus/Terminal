import { Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StockData, StockPrice } from '../../models/stock.model';
import * as Highcharts from 'highcharts/highstock';
import { Options } from 'highcharts';
import { HighchartsChartModule } from 'highcharts-angular';

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

  Highcharts: typeof Highcharts = Highcharts;
  chartOptions: Options = {};
  chartInstance: Highcharts.Chart | null = null;

  constructor() { }

  ngOnInit(): void {
    this.initChart();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['stockData'] || changes['chartType']) {
      this.updateChart();
    }
  }

  initChart(): void {
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
      series: [
        {
          type: this.chartType,
          name: this.stockData?.symbol || 'Akcje',
          data: this.formatChartData(),
          tooltip: {
            valueDecimals: 2
          }
        }
      ],
      credits: {
        enabled: false
      }
    };
  }

  updateChart(): void {
    if (this.chartOptions && this.chartOptions.series && this.chartOptions.series.length > 0) {
      this.chartOptions.title = {
        text: this.stockData ? `${this.stockData.symbol} - ${this.stockData.name || ''}` : 'Wykres akcji'
      };
      
      (this.chartOptions.series[0] as any).type = this.chartType;
      (this.chartOptions.series[0] as any).name = this.stockData?.symbol || 'Akcje';
      (this.chartOptions.series[0] as any).data = this.formatChartData();
      
      // Od nowa inicjalizujemy wykres zamiast używać updateFlag
      this.initChart();
    }
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
} 