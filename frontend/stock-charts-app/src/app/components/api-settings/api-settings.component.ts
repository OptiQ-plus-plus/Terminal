import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { StockService } from '../../services/stock.service';
import { ApiSettings } from '../../models/stock.model';

@Component({
  selector: 'app-api-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  template: `
    <div class="api-settings-container">
      <h1 class="component-title">Ustawienia API</h1>
      <div class="card">
        <h2>Konfiguracja źródeł danych</h2>
        <p>Tutaj będzie można skonfigurować źródła danych historycznych dla opcji IBM, INTC i TSLA.</p>
        
        <div class="quantum-settings">
          <h3>Integracja z obliczeniami kwantowymi</h3>
          <p>Status połączenia z komputerem kwantowym: <span class="status" [class.connected]="quantumConnected">{{ quantumStatus }}</span></p>
          
          <button class="btn primary" (click)="checkQuantumConnection()" [disabled]="checkingConnection">
            {{ checkingConnection ? 'Sprawdzanie...' : 'Sprawdź połączenie' }}
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .api-settings-container {
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
    
    h2 {
      font-size: 1.3rem;
      margin-top: 0;
      margin-bottom: 1.25rem;
      color: var(--text-primary);
      font-weight: 600;
    }
    
    h3 {
      font-size: 1.1rem;
      margin-top: 1.25rem;
      margin-bottom: 0.75rem;
      color: var(--text-primary);
      font-weight: 600;
    }
    
    .quantum-settings {
      margin-top: 2rem;
      padding-top: 1rem;
      border-top: 1px solid var(--border-color);
    }
    
    .status {
      font-weight: 600;
      color: var(--negative-color);
      
      &.connected {
        color: var(--positive-color);
      }
    }
    
    .btn {
      padding: 0.75rem 1.25rem;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-weight: 500;
      margin-top: 1rem;
      transition: background-color 0.2s, transform 0.1s;
      
      &.primary {
        background-color: var(--accent-color);
        color: white;
        
        &:hover:not(:disabled) {
          opacity: 0.9;
        }
        
        &:active:not(:disabled) {
          transform: translateY(1px);
        }
      }
      
      &:disabled {
        opacity: 0.7;
        cursor: not-allowed;
      }
    }
  `]
})
export class ApiSettingsComponent implements OnInit {
  quantumConnected = false;
  quantumStatus = 'Nieznany';
  checkingConnection = false;
  
  constructor(private stockService: StockService) {}
  
  ngOnInit(): void {
    this.checkQuantumConnection();
  }
  
  checkQuantumConnection(): void {
    this.checkingConnection = true;
    this.stockService.checkQuantumComputerStatus()
      .subscribe({
        next: (response) => {
          if (response.data) {
            this.quantumConnected = response.data.available;
            this.quantumStatus = response.data.available ? 'Połączony' : 'Niedostępny';
          } else {
            this.quantumConnected = false;
            this.quantumStatus = 'Błąd połączenia';
          }
          this.checkingConnection = false;
        },
        error: () => {
          this.quantumConnected = false;
          this.quantumStatus = 'Błąd połączenia';
          this.checkingConnection = false;
        }
      });
  }
} 