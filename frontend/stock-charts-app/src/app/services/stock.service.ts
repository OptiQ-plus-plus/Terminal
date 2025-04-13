import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse, StockData, StockMetadata } from '../models/stock.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class StockService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  /**
   * Wyszukuje instrumenty giełdowe na podstawie zapytania
   */
  searchStocks(query: string): Observable<ApiResponse<StockMetadata[]>> {
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
} 