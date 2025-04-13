import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-optimization',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="optimization-container">
      <h1 class="component-title">Optymalizacja Strategii</h1>
      <div class="card">
        <p>Komponent optymalizacji w trakcie implementacji.</p>
        <p>Tutaj będą dostępne narzędzia do optymalizacji strategii opcyjnych z uwzględnieniem risk attitude i time discounting.</p>
        <p>Komponent będzie również obsługiwał dyskretyzację rozkładów i konstruowanie macierzy QUMO do wysłania do komputera kwantowego.</p>
      </div>
    </div>
  `,
  styles: [`
    .optimization-container {
      padding: 1rem 0;
    }
    
    .component-title {
      font-size: 1.8rem;
      margin-bottom: 1.5rem;
      font-weight: 600;
      color: var(--text-primary);
    }
    
    .card {
      background-color: var(--card-bg);
      border-radius: 10px;
      box-shadow: var(--card-shadow);
      padding: 1.5rem;
      margin-bottom: 1.5rem;
    }
  `]
})
export class OptimizationComponent {

} 