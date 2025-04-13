import { Routes } from '@angular/router';
import { StockSearchComponent } from './components/stock-search/stock-search.component';
import { StockDetailsComponent } from './components/stock-details/stock-details.component';
import { PopularStocksComponent } from './components/popular-stocks/popular-stocks.component';

export const routes: Routes = [
  { path: '', component: PopularStocksComponent },
  { path: 'search', component: StockSearchComponent },
  { path: 'stock/:symbol', component: StockDetailsComponent },
  { path: '**', redirectTo: '' }
];
