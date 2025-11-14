import { ApplicationConfig, importProvidersFrom } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { TranslateModule } from '@ngx-translate/core';
import { authInterceptor } from './interceptors/auth.interceptor';
import { routes } from './app.routes';
import { baseUrlInterceptor } from './interceptors/base-url.interceptor';
import { accessTokenInterceptor } from './interceptors/access-token.interceptor';
import { handleErrorsInterceptor } from './interceptors/handle-errors.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(
      withInterceptors([
        baseUrlInterceptor,   
        authInterceptor,    
        accessTokenInterceptor,    
        handleErrorsInterceptor    
      ])
    ),
    provideAnimationsAsync(),
    importProvidersFrom(
      TranslateModule.forRoot({
        defaultLanguage: 'es'
      })
    )
  ]
};