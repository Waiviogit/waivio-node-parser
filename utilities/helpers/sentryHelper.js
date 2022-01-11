const axios = require('axios');
const { telegramApi } = require('constants/appData');
const Sentry = require('@sentry/node');

exports.sendSentryNotification = async () => {
  try {
    if (!['staging', 'production'].includes(process.env.NODE_ENV)) return;
    const result = await axios.get(`${telegramApi.HOST}${telegramApi.BASE_URL}${telegramApi.SENTRY_ERROR}?app=nodeParser&env=${process.env.NODE_ENV}`);
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
