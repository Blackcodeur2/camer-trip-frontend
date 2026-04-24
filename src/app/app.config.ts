import { APP_INITIALIZER, ApplicationConfig, LOCALE_ID, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter, withInMemoryScrolling } from '@angular/router';
import { routes } from './app.routes';
import { registerLocaleData } from '@angular/common';
import localeFr from '@angular/common/locales/fr';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { AppInitializerService } from './services/appInitializer/app-initializer-service';
import { authInterceptorInterceptor } from './core/interceptors/auth-interceptor-interceptor';
registerLocaleData(localeFr);
export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes, withInMemoryScrolling({ anchorScrolling: 'enabled', scrollPositionRestoration: 'enabled' })),
    provideHttpClient(withInterceptors([authInterceptorInterceptor])),
    { provide: LOCALE_ID, useValue: 'fr-FR' },
    {
      provide: APP_INITIALIZER,
      useFactory: (appInitializer: AppInitializerService) => () => appInitializer.initializeApp(),
      deps: [AppInitializerService],
      multi: true
    },
  ]
};
