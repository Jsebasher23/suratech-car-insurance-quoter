import { FieldSection, FormFieldConfig, FormValues } from './models';
import { maskDocument } from './masking';
import { parseIsoDate } from './dates';

export interface SummaryRow {
  key: string;
  label: string;
  value: string;
  masked: boolean;
}
export interface SummarySection {
  section: FieldSection;
  rows: SummaryRow[];
}

export interface SummaryText {
  yes: string;
  no: string;
  dateLocale: string;
}

/** US-03-AC-01/02/03 — human-readable, masked, grouped values for the summary. */
export function buildSummary(fields: FormFieldConfig[], values: FormValues, text: SummaryText): SummarySection[] {
  const bySection = new Map<FieldSection, SummaryRow[]>();
  for (const f of fields) {
    const raw = values[f.key];
    let value: string;
    switch (f.type) {
      case 'checkbox':
        value = raw === true ? text.yes : text.no;
        break;
      case 'select':
        value = f.options.find((o) => o.value === raw)?.label ?? '—';
        break;
      case 'date': {
        const d = parseIsoDate(raw);
        value = d ? new Intl.DateTimeFormat(text.dateLocale, { dateStyle: 'long' }).format(d) : '—';
        break;
      }
      default:
        value = raw === null || raw === undefined || raw === '' ? '—' : String(raw);
    }
    const masked = f.role === 'documentNumber' && value !== '—';
    if (masked) value = maskDocument(value);
    if (f.role === 'vehiclePlate' && value !== '—') value = value.toUpperCase();
    const rows = bySection.get(f.section) ?? [];
    rows.push({ key: f.key, label: f.label, value, masked });
    bySection.set(f.section, rows);
  }
  return [...bySection.entries()].map(([section, rows]) => ({ section, rows }));
}
