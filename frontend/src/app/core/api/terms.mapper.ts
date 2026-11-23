import { LegalTerms } from '../domain/models';
import { LegalTermDto } from './strapi.types';

/** US-03-AC-05 — plain text only; blank lines split paragraphs (never innerHTML). */
export function mapTerms(dtos: LegalTermDto[]): LegalTerms | null {
  const d = dtos[0];
  if (!d) return null;
  return {
    title: d.title,
    version: d.version,
    paragraphs: d.body
      .split(/\n\s*\n/)
      .map((p) => p.trim())
      .filter(Boolean),
  };
}
