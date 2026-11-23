import { factories } from '@strapi/strapi';

// ADR-0004: only read routes exist; write operations are not even routed.
export default factories.createCoreRouter('api::form-field.form-field', {
  only: ['find', 'findOne'],
});
