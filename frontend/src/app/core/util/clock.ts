import { Injectable } from '@angular/core';

/** Injectable "today" so date rules (age, vehicle year, pricing) are deterministic in tests. */
@Injectable({ providedIn: 'root' })
export class Clock {
  today(): Date {
    const n = new Date();
    return new Date(n.getFullYear(), n.getMonth(), n.getDate());
  }
}
