import { Component, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { environment } from '../environments/environment';
import { HttpClient } from '@angular/common/http';

interface BackendInfo {
  version: string;
  name: string;
  environment: string;
  api_version: string;
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterModule, CommonModule],
  templateUrl: './app.component.html'
})
export class AppComponent implements OnInit {
  appVersion = environment.version;
  backendInfo: BackendInfo | null = null;
  backendError = false;

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.fetchBackendInfo();
  }

  fetchBackendInfo(): void {
    this.http.get<BackendInfo>(`${environment.apiUrl}/info`).subscribe({
      next: (info) => {
        this.backendInfo = info;
        this.backendError = false;
      },
      error: () => {
        this.backendError = true;
      }
    });
  }
}
