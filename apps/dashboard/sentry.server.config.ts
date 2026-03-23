// This file configures the initialization of Sentry on the server.
// The config you add here will be used whenever the server handles a request.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: 'https://54f5375a34406de793ecad4a1a9ba386@o4509929700196352.ingest.us.sentry.io/4509929700851712',

  // Define how likely traces are sampled. Adjust this value in production, or use tracesSampler for greater control.
  tracesSampleRate: 1,

  // Enable logs to be sent to Sentry
  enableLogs: true,

  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: false,

  // Environment configuration for better error tracking
  environment: process.env.NODE_ENV || 'development',
  release: process.env.npm_package_version || '1.0.0',
});
