const express = require('express');
const logger = require('morgan');
const { routes } = require('routes');
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
    // enable HTTP calls tracing
    new Sentry.Integrations.Http({ tracing: true }),
    // enable Express.js middleware tracing
    new Tracing.Integrations.Express({ app }),
  ],
});
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use('/', routes);

process.on('unhandledRejection', (error) => {
  sendSentryNotification();
  Sentry.captureException(error);
});

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});

runStream().catch((err) => {
  sendSentryNotification();
  Sentry.captureException(err);
  console.log(err);
  process.exit(1);
});

startRedisListener();

module.exports = app;
