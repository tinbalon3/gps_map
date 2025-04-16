import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withJsonpSupport } from '@angular/common/http';
import { routes } from './app.routes';
import { provideClientHydration } from '@angular/platform-browser';
import { LocationService } from './services/location.service';
import { RoutingService } from './services/routing.service';
import { environment } from '../environments/environment';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideClientHydration(),
    provideHttpClient(withJsonpSupport()),
    LocationService,
    RoutingService,
   
    {
      provide: 'AZURE_MAPS_KEY',
      useValue: environment.azureMaps.subscriptionKey
    }
  ]
};
