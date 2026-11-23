import { Injector, Signal, computed, inject, signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { Observable, catchError, map, of, startWith, switchMap } from 'rxjs';

export type AsyncState<T> =
  | { status: 'loading' }
  | { status: 'success'; value: T }
  | { status: 'error'; error: unknown };

export interface AsyncResource<T> {
  state: Signal<AsyncState<T>>;
  /** value when loaded, otherwise undefined */
  value: Signal<T | undefined>;
  reload(): void;
}

/**
 * Loads `loader(params)` every time `params()` changes (country, language…) or `reload()` is
 * called. Gives every async view the loading / error / success states (CLAUDE.md §3.9).
 * `params()` returning undefined keeps the resource in loading.
 */
export function asyncResource<P, T>(
  params: () => P | undefined,
  loader: (p: P) => Observable<T>,
  injector: Injector = inject(Injector),
): AsyncResource<T> {
  const tick = signal(0);
  const trigger = computed(() => ({ p: params(), t: tick() }));
  const state = toSignal(
    toObservable(trigger, { injector }).pipe(
      switchMap(({ p }) =>
        p === undefined
          ? of<AsyncState<T>>({ status: 'loading' })
          : loader(p).pipe(
              map((value): AsyncState<T> => ({ status: 'success', value })),
              catchError((error: unknown) => of<AsyncState<T>>({ status: 'error', error })),
              startWith<AsyncState<T>>({ status: 'loading' }),
            ),
      ),
    ),
    { initialValue: { status: 'loading' } as AsyncState<T>, injector },
  );
  const value = computed(() => {
    const s = state();
    return s.status === 'success' ? s.value : undefined;
  });
  return { state, value, reload: () => tick.update((n) => n + 1) };
}
