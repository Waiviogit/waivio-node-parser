const axios = require('axios');
const Sentry = require('@sentry/node');
const config = require('config');

const { telegramApi } = config;

exports.sendSentryNotification = async () => {
  try {
    if (!['staging', 'production'].includes(config.environment)) return;
    const result = await axios.get(
      `${telegramApi.HOST}${telegramApi.BASE_URL}${telegramApi.SENTRY_ERROR}?app=nodeParser&env=${config.environment}`,
    );
    return { result: result.data };
  } catch (error) {
    return { error };
  }
};

exports.captureException = async (message) => {
  Sentry.captureException({ error: { message } });
  await this.sendSentryNotification();
  return false;
};
