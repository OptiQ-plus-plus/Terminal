import { ApplicationConfig, isDevMode } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';

import { routes } from './app.routes';

// Log informujący o trybie watchera
if (isDevMode()) {
  console.log('%c🔄 TRYB WATCHER AKTYWNY', 'background: #4CAF50; color: white; padding: 5px; border-radius: 5px; font-weight: bold;');
  console.log('Zmiany w kodzie będą automatycznie przeładowywane.');
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient()
  ]
};
