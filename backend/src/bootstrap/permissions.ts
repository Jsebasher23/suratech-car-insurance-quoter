import type { Core } from '@strapi/strapi';

/**
 * ADR-0004 — The Public role gets EXACTLY these actions, nothing else.
 * Applied on every boot so a click in the admin cannot silently widen access (drift protection).
 */
export const PUBLIC_ACTIONS = [
  'api::country.country.find',
  'api::country.country.findOne',
  'api::form-field.form-field.find',
  'api::form-field.form-field.findOne',
  'api::plan.plan.find',
  'api::plan.plan.findOne',
  'api::legal-term.legal-term.find',
  'api::legal-term.legal-term.findOne',
] as const;

export async function enforcePublicPermissions(strapi: Core.Strapi): Promise<void> {
  const role = await strapi.db
    .query('plugin::users-permissions.role')
    .findOne({ where: { type: 'public' } });
  if (!role) {
    strapi.log.warn('[permissions] Public role not found; skipping');
    return;
  }

  const permissionQuery = strapi.db.query('plugin::users-permissions.permission');
  const current: { id: number; action: string }[] = await permissionQuery.findMany({
    where: { role: role.id },
  });

  const allowed = new Set<string>(PUBLIC_ACTIONS);
  const extra = current.filter((p) => !allowed.has(p.action));
  for (const p of extra) {
    strapi.log.warn(`[permissions] Removing non-allowed Public permission: ${p.action}`);
    await permissionQuery.delete({ where: { id: p.id } });
  }

  const present = new Set(current.map((p) => p.action));
  for (const action of PUBLIC_ACTIONS) {
    if (!present.has(action)) {
      await permissionQuery.create({ data: { action, role: role.id } });
    }
  }
  strapi.log.info(`[permissions] Public role = ${PUBLIC_ACTIONS.length} read-only actions`);
}
