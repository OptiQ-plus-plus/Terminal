import { Component, OnInit } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Observable, Subject, debounceTime, distinctUntilChanged, of, switchMap } from 'rxjs';
import { StockMetadata } from '../../models/stock.model';
import { StockService } from '../../services/stock.service';

@Component({
  selector: 'app-stock-search',
  templateUrl: './stock-search.component.html',
  styleUrls: ['./stock-search.component.scss'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule]
})
export class StockSearchComponent implements OnInit {
  searchControl = new FormControl('');
  searchResults$: Observable<StockMetadata[]> = of([]);
  isLoading = false;
  private searchTerms = new Subject<string>();

  constructor(
    private stockService: StockService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.searchResults$ = this.searchTerms.pipe(
      debounceTime(500),
      distinctUntilChanged(),
      switchMap((term: string) => {
        if (!term.trim()) {
          return of([]);
        }
        
        this.isLoading = true;
        return this.stockService.searchStocks(term).pipe(
          switchMap(response => {
            this.isLoading = false;
            return of(response.data || []);
          })
        );
      })
    );
  }

  search(term: string): void {
    this.searchTerms.next(term);
  }

  onSearchInput(): void {
    this.search(this.searchControl.value || '');
  }

  viewStock(symbol: string): void {
    this.router.navigate(['/stock', symbol]);
  }
} 