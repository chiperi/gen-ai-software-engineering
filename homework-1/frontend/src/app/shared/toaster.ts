import { Component, inject } from '@angular/core';

import { ToastService } from '../core/toast.service';

@Component({
  selector: 'app-toaster',
  template: `
    <div class="toaster">
      @for (t of toastService.toasts(); track t.id) {
        <div class="toast" [class.success]="t.kind === 'success'" [class.error]="t.kind === 'error'">
          <span>{{ t.text }}</span>
          <button class="x" (click)="toastService.dismiss(t.id)" aria-label="Dismiss">×</button>
        </div>
      }
    </div>
  `,
  styles: [
    `
      .toaster {
        position: fixed;
        bottom: 20px;
        right: 20px;
        display: flex;
        flex-direction: column;
        gap: 8px;
        z-index: 1000;
      }
      .toast {
        display: flex;
        align-items: center;
        gap: 12px;
        min-width: 260px;
        max-width: 360px;
        padding: 12px 14px;
        border-radius: 6px;
        background: var(--surface);
        color: var(--text);
        border: 1px solid var(--border);
        border-left: 4px solid var(--brand);
        box-shadow: var(--shadow-16);
        animation: slide-in 0.18s ease;
      }
      .toast.success {
        border-left-color: var(--ok);
      }
      .toast.error {
        border-left-color: var(--err);
      }
      .x {
        margin-left: auto;
        background: none;
        border: none;
        color: var(--text-secondary);
        font-size: 18px;
        line-height: 1;
        cursor: pointer;
      }
      @keyframes slide-in {
        from {
          opacity: 0;
          transform: translateY(8px);
        }
      }
    `,
  ],
})
export class Toaster {
  protected readonly toastService = inject(ToastService);
}
