import { Component, OnInit, Renderer2 } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { environment } from '../environments/environment';
import { HttpClient } from '@angular/common/http';
import { catchError } from 'rxjs/operators';
import { of } from 'rxjs';

interface BackendInfo {
  version: string;
  name: string;
  environment: string;
  api_version: string;
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CommonModule],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  appVersion = '1.0.0';
  backendInfo: BackendInfo | null = null;
  backendError = false;
  currentTheme: 'light' | 'dark' = 'light';

  constructor(
    private http: HttpClient,
    private renderer: Renderer2
  ) {}

  ngOnInit(): void {
    this.checkBackendStatus();
    this.loadSavedTheme();
  }

  private checkBackendStatus() {
    this.http.get<{ status: string, data: BackendInfo }>(`${environment.apiUrl}/status`)
      .pipe(
        catchError(error => {
          console.error('Backend connection error:', error);
          this.backendError = true;
          return of(null);
        })
      )
      .subscribe(response => {
        if (response) {
          this.backendInfo = response.data;
        }
      });
  }

  private loadSavedTheme() {
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark';
    if (savedTheme) {
      this.currentTheme = savedTheme;
      this.applyTheme(savedTheme);
    } else {
      // Domyślnie sprawdź preferencje systemowe
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      this.currentTheme = prefersDark ? 'dark' : 'light';
      this.applyTheme(this.currentTheme);
    }
  }

  toggleTheme() {
    this.currentTheme = this.currentTheme === 'light' ? 'dark' : 'light';
    this.applyTheme(this.currentTheme);
    localStorage.setItem('theme', this.currentTheme);
  }

  private applyTheme(theme: 'light' | 'dark') {
    if (theme === 'dark') {
      this.renderer.setAttribute(document.documentElement, 'data-theme', 'dark');
    } else {
      this.renderer.removeAttribute(document.documentElement, 'data-theme');
    }
  }
}
