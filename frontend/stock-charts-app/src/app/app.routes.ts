import { Routes } from '@angular/router';
import { OptionsAnalyzerComponent } from './components/options-analyzer/options-analyzer.component';

export const routes: Routes = [
  { 
    path: '', 
    redirectTo: 'dashboard', 
    pathMatch: 'full' 
  },
  {
    path: 'dashboard',
    loadComponent: () => import('./components/popular-stocks/popular-stocks.component')
      .then(m => m.PopularStocksComponent)
  },
  {
    path: 'stock/:symbol',
    loadComponent: () => import('./components/stock-details/stock-details.component')
      .then(m => m.StockDetailsComponent)
  },
  {
    path: 'search',
    loadComponent: () => import('./components/stock-search/stock-search.component')
      .then(m => m.StockSearchComponent)
  },
  {
    path: 'options-analyzer',
    component: OptionsAnalyzerComponent
  },
  {
    path: 'prediction-models',
    loadComponent: () => import('./components/prediction-models/prediction-models.component')
      .then(m => m.PredictionModelsComponent)
  },
  {
    path: 'optimization',
    loadComponent: () => import('./components/optimization/optimization.component')
      .then(m => m.OptimizationComponent)
  },
  {
    path: 'api-settings',
    loadComponent: () => import('./components/api-settings/api-settings.component')
      .then(m => m.ApiSettingsComponent)
  },
  { 
    path: '**', 
    redirectTo: 'dashboard' 
  }
];
