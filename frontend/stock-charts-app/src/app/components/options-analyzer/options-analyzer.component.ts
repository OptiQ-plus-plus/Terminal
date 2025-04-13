import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { StockService } from '../../services/stock.service';
import { OptionWithGreeks } from '../../models/stock.model';

@Component({
  selector: 'app-options-analyzer',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './options-analyzer.component.html',
  styleUrls: ['./options-analyzer.component.scss']
})
export class OptionsAnalyzerComponent implements OnInit {
  searchForm: FormGroup;
  loading = false;
  error: string | null = null;
  success = false;
  
  stockSymbols = ['IBM', 'INTC', 'TSLA']; // Predefiniowane symbole zgodnie z wymaganiami
  expirationDates: string[] = [];
  optionTypes = ['call', 'put'];
  
  options: OptionWithGreeks[] = [];
  selectedOption: OptionWithGreeks | null = null;
  
  constructor(
    private fb: FormBuilder,
    private stockService: StockService
  ) {
    this.searchForm = this.fb.group({
      symbol: ['IBM', Validators.required],
      expirationDate: ['', Validators.required],
      optionType: ['call', Validators.required],
      minStrike: [null],
      maxStrike: [null]
    });
  }
  
  ngOnInit(): void {
    this.loadExpirationDates();
  }
  
  loadExpirationDates(): void {
    const symbol = this.searchForm.get('symbol')?.value;
    if (!symbol) return;
    
    this.loading = true;
    this.stockService.getOptionExpirationDates(symbol)
      .subscribe({
        next: (response) => {
          if (response.data && response.data.length > 0) {
            this.expirationDates = response.data;
            this.searchForm.get('expirationDate')?.setValue(this.expirationDates[0]);
          } else {
            this.expirationDates = [];
            this.error = 'Brak dostępnych dat wygaśnięcia dla wybranego symbolu';
          }
          this.loading = false;
        },
        error: (err) => {
          this.error = 'Błąd podczas ładowania dat wygaśnięcia: ' + (err.message || 'Nieznany błąd');
          this.loading = false;
        }
      });
  }
  
  onSymbolChange(): void {
    this.loadExpirationDates();
  }
  
  searchOptions(): void {
    if (this.searchForm.invalid) {
      return;
    }
    
    const values = this.searchForm.value;
    const strikeRange = (values.minStrike && values.maxStrike) ? 
      { min: values.minStrike, max: values.maxStrike } : undefined;
    
    this.loading = true;
    this.error = null;
    this.success = false;
    
    this.stockService.getOptionsData(
      values.symbol,
      values.expirationDate,
      values.optionType,
      strikeRange
    ).subscribe({
      next: (response) => {
        if (response.data) {
          this.options = response.data;
          this.success = true;
        } else {
          this.options = [];
          this.error = 'Brak danych opcji dla wybranych parametrów';
        }
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Błąd podczas wyszukiwania opcji: ' + (err.message || 'Nieznany błąd');
        this.loading = false;
      }
    });
  }
  
  selectOption(option: OptionWithGreeks): void {
    this.selectedOption = option;
  }
  
  generatePrediction(): void {
    if (!this.selectedOption) return;
    
    // Obsługa generowania predykcji zostanie rozwinięta w ramach pełnej implementacji
    console.log('Generowanie predykcji dla', this.selectedOption.symbol);
  }
} 