import { TestBed } from '@angular/core/testing';

import { ToastService } from './toast.service';

describe('ToastService', () => {
  let toast: ToastService;

  beforeEach(() => {
    vi.useFakeTimers();
    TestBed.configureTestingModule({ providers: [ToastService] });
    toast = TestBed.inject(ToastService);
  });

  afterEach(() => vi.useRealTimers());

  it('adds a toast with a unique id and the given kind', () => {
    toast.success('done');
    toast.error('boom');

    const list = toast.toasts();
    expect(list.length).toBe(2);
    expect(list[0]).toMatchObject({ text: 'done', kind: 'success' });
    expect(list[1]).toMatchObject({ text: 'boom', kind: 'error' });
    expect(list[0].id).not.toBe(list[1].id);
  });

  it('auto-dismisses a toast after 4s', () => {
    toast.show('hi');
    expect(toast.toasts().length).toBe(1);

    vi.advanceTimersByTime(4000);
    expect(toast.toasts().length).toBe(0);
  });

  it('dismiss removes only the matching toast', () => {
    toast.show('a');
    toast.show('b');
    const [first] = toast.toasts();

    toast.dismiss(first.id);
    const remaining = toast.toasts();
    expect(remaining.length).toBe(1);
    expect(remaining[0].text).toBe('b');
  });
});
