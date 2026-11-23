import type { Core } from '@strapi/strapi';
import { enforcePublicPermissions } from './bootstrap/permissions';
import { seedIfEmpty } from './seed/seed';

export default {
  register() {},

  /**
   * 1. Seed fictitious content for CO and CL (only when the DB is empty, or SEED_FORCE=true).
   * 2. Enforce the minimal Public permissions (ADR-0004) on every boot.
   */
  async bootstrap({ strapi }: { strapi: Core.Strapi }) {
    await seedIfEmpty(strapi);
    await enforcePublicPermissions(strapi);
  },
};
