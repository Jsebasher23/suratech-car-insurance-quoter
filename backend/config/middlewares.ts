import type { Core } from '@strapi/strapi';

// ADR-0004: in production the browser reaches Strapi same-origin through nginx (/api).
// CORS is only opened for the explicitly configured dev origins.
const config = ({ env }: Core.Config.Shared.ConfigParams): Core.Config.Middlewares => [
  'strapi::logger',
  'strapi::errors',
  'strapi::security',
  {
    name: 'strapi::cors',
    config: {
      origin: env.array('CORS_ORIGINS', ['http://localhost:4200', 'http://localhost:8080']),
      methods: ['GET', 'HEAD', 'OPTIONS'],
      headers: ['Content-Type', 'Accept', 'Origin'],
    },
  },
  'strapi::poweredBy',
  'strapi::query',
  'strapi::body',
  'strapi::session',
  'strapi::favicon',
  'strapi::public',
];

export default config;
