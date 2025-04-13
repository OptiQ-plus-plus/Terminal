import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { StockService } from '../../services/stock.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-prediction-models',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './prediction-models.component.html',
  styleUrls: ['./prediction-models.component.scss']
})
export class PredictionModelsComponent implements OnInit {
  predictionForm: FormGroup;
  loading = false;
  error: string | null = null;
  success = false;
  symbols = environment.defaultSymbols;
  selectedSymbol: string = this.symbols[0];
  predictionResult: any = null;

  constructor(
    private fb: FormBuilder,
    private stockService: StockService
  ) {
    this.predictionForm = this.fb.group({
      symbol: [this.symbols[0], Validators.required],
      strikePrice: [100, [Validators.required, Validators.min(1)]],
      timeHorizon: [30, [Validators.required, Validators.min(1), Validators.max(365)]],
      volatilityMultiplier: [1, [Validators.required, Validators.min(0.1), Validators.max(5)]],
      confidenceLevel: [0.95, [Validators.required, Validators.min(0.5), Validators.max(0.99)]]
    });
  }

  ngOnInit(): void {
  }

  onSubmit(): void {
    if (this.predictionForm.invalid) {
      return;
    }

    this.loading = true;
    this.error = null;
    this.success = false;
    this.predictionResult = null;

    const formValues = this.predictionForm.value;

    this.stockService.generateProbabilityDistribution(
      formValues.symbol,
      {
        strikePrice: formValues.strikePrice,
        timeHorizon: formValues.timeHorizon,
        volatilityMultiplier: formValues.volatilityMultiplier,
        confidenceLevel: formValues.confidenceLevel
      }
    ).subscribe({
      next: (response) => {
        if (response.data) {
          this.predictionResult = response.data;
          this.success = true;
        } else {
          this.error = 'Brak danych w odpowiedzi';
        }
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Błąd podczas generowania predykcji: ' + (err.message || 'Nieznany błąd');
        this.loading = false;
      }
    });
  }
} 