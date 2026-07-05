import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';

import { ToastService } from './toast.service';

/**
 * Surfaces HTTP 429 (rate limit) responses as a friendly toast, then rethrows so callers
 * can still react if they need to.
 */
export const rateLimitInterceptor: HttpInterceptorFn = (req, next) => {
  const toast = inject(ToastService);
  return next(req).pipe(
    catchError((err: HttpErrorResponse) => {
      if (err.status === 429) {
        toast.error('Rate limit reached. Please wait a moment and try again.');
      }
      return throwError(() => err);
    }),
  );
};
