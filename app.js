const express = require('express');
const Sentry = require('@sentry/node');
const Tracing = require('@sentry/tracing');
const { sendSentryNotification } = require('utilities/helpers/sentryHelper');
const { runStream } = require('processor/processor');
require('utilities/jobs');
const { startRedisListener } = require('utilities/helpers/redisHelper');

const app = express();

Sentry.init({
  environment: process.env.NODE_ENV,
  dsn: process.env.SENTRY_DNS,
  integrations: [
    // enable Express.js middleware tracing
    new Tracing.Integrations.Express({ app }),
  ],
});

process.on('unhandledRejection', (error) => {
  sendSentryNotification();
  Sentry.captureException(error);
});

runStream().catch((err) => {
  sendSentryNotification();
  Sentry.captureException(err);
  console.log(err);
  process.exit(1);
});

startRedisListener();

module.exports = app;
