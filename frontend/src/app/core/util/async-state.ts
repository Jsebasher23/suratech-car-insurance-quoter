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

export interface AsyncResourceOptions<P> {
  /**
   * Stale-while-revalidate (RV-09): when it returns true for (previous, next) params, the previous
   * value stays visible while the next one loads (e.g. same country, new language) instead of
   * flashing a skeleton and tearing down the form.
   */
  keepPrevious?: (prev: P, next: P) => boolean;
  injector?: Injector;
}

/**
 * Loads `loader(params)` every time `params()` changes (country, language…) or `reload()` is
 * called. Gives every async view the loading / error / success states (CLAUDE.md §3.9).
 * `params()` returning undefined keeps the resource in loading.
 */
export function asyncResource<P, T>(
  params: () => P | undefined,
  loader: (p: P) => Observable<T>,
  options: AsyncResourceOptions<P> = {},
): AsyncResource<T> {
  const injector = options.injector ?? inject(Injector);
  const tick = signal(0);
  const trigger = computed(() => ({ p: params(), t: tick() }));
  let last: { p: P; value: T } | null = null;

  const state = toSignal(
    toObservable(trigger, { injector }).pipe(
      switchMap(({ p }) => {
        if (p === undefined) return of<AsyncState<T>>({ status: 'loading' });
        const prev = last;
        const initial: AsyncState<T> =
          prev && options.keepPrevious?.(prev.p, p) ? { status: 'success', value: prev.value } : { status: 'loading' };
        return loader(p).pipe(
          map((value): AsyncState<T> => {
            last = { p, value };
            return { status: 'success', value };
          }),
          catchError((error: unknown) => of<AsyncState<T>>({ status: 'error', error })),
          startWith(initial),
        );
      }),
    ),
    { initialValue: { status: 'loading' } as AsyncState<T>, injector },
  );
  const value = computed(() => {
    const s = state();
    return s.status === 'success' ? s.value : undefined;
  });
  return { state, value, reload: () => tick.update((n) => n + 1) };
}
