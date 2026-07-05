import { HttpClient } from '@angular/common/http';
import { Component, DestroyRef, inject, signal } from '@angular/core';

/**
 * Small topbar chip that pings the backend health endpoint (/api/actuator/health)
 * and shows whether the API is online. Polls every 15s.
 */
@Component({
  selector: 'app-api-status',
  template: `
    <span class="chip" [class.on]="up() === true" [class.off]="up() === false" title="Backend health">
      <span class="dot"></span>
      @if (up() === null) {
        Checking…
      } @else if (up()) {
        API online
      } @else {
        API offline
      }
    </span>
  `,
  styles: [
    `
      .chip {
        display: inline-flex;
        align-items: center;
        gap: 7px;
        font-size: 12.5px;
        font-weight: 600;
        color: var(--text-secondary);
        padding: 5px 12px;
        border-radius: 999px;
        border: 1px solid var(--glass-border);
        background: var(--surface-2);
      }
      .dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: var(--text-disabled);
      }
      .chip.on {
        color: var(--ok);
      }
      .chip.on .dot {
        background: var(--ok);
        box-shadow: 0 0 8px var(--ok);
      }
      .chip.off {
        color: var(--err);
      }
      .chip.off .dot {
        background: var(--err);
      }
    `,
  ],
})
export class ApiStatus {
  private readonly http = inject(HttpClient);
  readonly up = signal<boolean | null>(null);

  constructor() {
    const check = () =>
      this.http.get<{ status: string }>('/api/actuator/health').subscribe({
        next: (r) => this.up.set(r.status === 'UP'),
        error: () => this.up.set(false),
      });
    check();
    const id = setInterval(check, 15000);
    inject(DestroyRef).onDestroy(() => clearInterval(id));
  }
}
