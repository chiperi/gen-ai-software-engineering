import { Component, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

import { ApiStatus } from './shared/api-status';
import { Toaster } from './shared/toaster';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, Toaster, ApiStatus],
  template: `
    <div class="shell">
      <aside class="nav">
        <div class="brand">
          <span class="logo">▦</span>
          <span class="brand-name grad">Banking</span>
        </div>
        <nav>
          <a routerLink="/transactions" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: true }">
            <span class="dot"></span>Transactions
          </a>
          <a routerLink="/transactions/new" routerLinkActive="active">
            <span class="dot"></span>New transaction
          </a>
          <a routerLink="/accounts" routerLinkActive="active">
            <span class="dot"></span>Account tools
          </a>
        </nav>
      </aside>

      <div class="main">
        <header class="topbar">
          <span class="title">Banking Transactions</span>
          <div class="top-actions">
            <app-api-status />
            <a class="btn btn-subtle" href="http://localhost:3000/docs" target="_blank" rel="noopener">
              API docs ↗
            </a>
            <button class="btn btn-subtle" (click)="toggleTheme()">
              {{ dark() ? '☀ Light' : '☾ Dark' }}
            </button>
          </div>
        </header>
        <main class="content">
          <router-outlet />
        </main>
      </div>
    </div>

    <app-toaster />
  `,
  styles: [
    `
      .shell {
        display: flex;
        min-height: 100vh;
        gap: var(--s-4);
        padding: var(--s-4);
      }
      .nav {
        width: 232px;
        flex-shrink: 0;
        background: var(--surface);
        border: 1px solid var(--glass-border);
        border-radius: var(--radius-lg);
        box-shadow: var(--shadow-8);
        backdrop-filter: blur(22px) saturate(150%);
        -webkit-backdrop-filter: blur(22px) saturate(150%);
        padding: var(--s-5);
        display: flex;
        flex-direction: column;
        gap: var(--s-6);
        position: sticky;
        top: var(--s-4);
        height: calc(100vh - var(--s-8));
      }
      .brand {
        display: flex;
        align-items: center;
        gap: var(--s-3);
        font-weight: 700;
        font-size: 20px;
      }
      .logo {
        display: grid;
        place-items: center;
        width: 34px;
        height: 34px;
        border-radius: 10px;
        background: var(--grad);
        color: #fff;
        box-shadow: var(--glow);
        font-size: 18px;
      }
      .nav nav {
        display: flex;
        flex-direction: column;
        gap: 4px;
      }
      .nav a {
        position: relative;
        display: flex;
        align-items: center;
        gap: 10px;
        color: var(--text);
        padding: 10px 14px;
        border-radius: var(--radius);
        text-decoration: none;
        font-weight: 500;
        transition: background 0.15s ease, color 0.15s ease;
      }
      .nav a .dot {
        width: 6px;
        height: 6px;
        border-radius: 50%;
        background: var(--text-disabled);
        transition: background 0.15s ease, transform 0.15s ease;
      }
      .nav a:hover {
        background: var(--surface-2);
      }
      .nav a.active {
        background: var(--grad-soft);
        color: var(--brand);
        font-weight: 600;
      }
      .nav a.active .dot {
        background: var(--brand);
        transform: scale(1.5);
        box-shadow: var(--glow);
      }
      .nav-foot {
        margin-top: auto;
        font-size: 11px;
        letter-spacing: 0.04em;
        text-transform: uppercase;
      }
      .main {
        flex: 1;
        display: flex;
        flex-direction: column;
        min-width: 0;
      }
      .topbar {
        position: sticky;
        top: var(--s-4);
        z-index: 5;
        height: 56px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0 var(--s-6);
        background: var(--surface);
        border: 1px solid var(--glass-border);
        border-radius: var(--radius-lg);
        box-shadow: var(--shadow-2);
        backdrop-filter: blur(22px) saturate(150%);
        -webkit-backdrop-filter: blur(22px) saturate(150%);
      }
      .title {
        font-weight: 600;
        font-size: 15px;
        letter-spacing: 0.01em;
      }
      .top-actions {
        display: flex;
        align-items: center;
        gap: 10px;
      }
      .content {
        padding: var(--s-6) var(--s-2);
        max-width: 1120px;
        width: 100%;
      }
      @media (max-width: 720px) {
        .shell {
          flex-direction: column;
        }
        .nav {
          width: auto;
          height: auto;
          position: static;
          flex-direction: row;
          align-items: center;
          gap: var(--s-4);
          overflow-x: auto;
        }
        .nav nav {
          flex-direction: row;
        }
        .nav-foot {
          display: none;
        }
      }
    `,
  ],
})
export class App {
  protected readonly dark = signal(false);

  toggleTheme(): void {
    this.dark.update((v) => !v);
    document.documentElement.dataset['theme'] = this.dark() ? 'dark' : 'light';
  }
}
