import { CurrencyCode, Plan } from '../domain/models';
import { PlanDto } from './strapi.types';

/**
 * US-02-AC-02 order then name · US-02-AC-04 only the first recommended is highlighted ·
 * US-02-AC-10 plans in a currency other than the country's are dropped.
 * `active` is filtered server-side too; we re-check defensively.
 */
export function mapPlans(dtos: PlanDto[], countryCurrency: CurrencyCode): Plan[] {
  const plans = dtos
    .filter((d) => d.active !== false)
    .filter((d) => {
      if (d.currency !== countryCurrency) {
        console.warn(`[plans] Hiding plan "${d.code}": currency ${d.currency} ≠ ${countryCurrency}`);
        return false;
      }
      return true;
    })
    .map(
      (d): Plan => ({
        code: d.code,
        name: d.name,
        shortDescription: d.shortDescription ?? '',
        badge: d.badge ?? undefined,
        basePrice: Number(d.basePrice),
        currency: d.currency as CurrencyCode,
        order: d.order ?? 0,
        highlighted: d.recommended === true,
        coverages: (d.coverages ?? []).map((c) => ({ name: c.name, detail: c.detail ?? undefined })),
        benefits: (d.benefits ?? []).map((b) => b.text),
      }),
    )
    .sort((a, b) => a.order - b.order || a.name.localeCompare(b.name));

  let highlightUsed = false;
  return plans.map((p) => {
    const highlighted = p.highlighted && !highlightUsed;
    if (highlighted) highlightUsed = true;
    return { ...p, highlighted };
  });
}
