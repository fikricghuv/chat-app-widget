import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component'; // Ganti ChatApp jadi AppComponent
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { ApplicationConfig } from '@angular/core';
import { providePrimeNG } from 'primeng/config';
import { $t, updatePreset } from '@primeng/themes';
import Aura from '@primeng/themes/aura';


const bluePalette = Aura.primitive['blue'];

export const appConfig: ApplicationConfig = {
  providers: [
    provideHttpClient(
      withFetch(),
    ),
    provideAnimationsAsync(),
    providePrimeNG({
      theme: {
        preset: Aura,
        options: { darkModeSelector: '.p-dark' }
      }
    }),
  ],
};

bootstrapApplication(AppComponent, appConfig).then(() => {
  updatePreset({
    semantic: {
      primary: bluePalette
    }
  });
});
