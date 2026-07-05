import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { rateLimitInterceptor } from './rate-limit-interceptor';
import { ToastService } from './toast.service';

describe('rateLimitInterceptor', () => {
  let http: HttpClient;
  let httpCtrl: HttpTestingController;
  let toast: ToastService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([rateLimitInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    http = TestBed.inject(HttpClient);
    httpCtrl = TestBed.inject(HttpTestingController);
    toast = TestBed.inject(ToastService);
  });

  afterEach(() => httpCtrl.verify());

  it('shows an error toast on HTTP 429 and rethrows', () => {
    const spy = vi.spyOn(toast, 'error');
    let errored: number | undefined;

    http.get('/api/transactions').subscribe({
      next: () => {},
      error: (e) => (errored = e.status),
    });

    httpCtrl.expectOne('/api/transactions').flush('', { status: 429, statusText: 'Too Many Requests' });

    expect(spy).toHaveBeenCalledTimes(1);
    expect(errored).toBe(429);
  });

  it('does not toast for non-429 errors', () => {
    const spy = vi.spyOn(toast, 'error');

    http.get('/api/transactions').subscribe({ next: () => {}, error: () => {} });
    httpCtrl.expectOne('/api/transactions').flush('', { status: 500, statusText: 'Server Error' });

    expect(spy).not.toHaveBeenCalled();
  });
});
