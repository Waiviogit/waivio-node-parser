const RedisSMQ = require('rsmq');
const config = require('config');
const sentryHelper = require('utilities/helpers/sentryHelper');

exports.rsmqClient = new RedisSMQ({ options: { db: config.redis.actionsQueue } });

exports.createQueue = async ({ client, qname = 'vip_tickets' }) => {
  if (!client) return { error: { message: 'Client is required parameter' } };
  try {
    const res = await client.createQueueAsync({ qname });

    if (res === 1) return { result: true };
    return { result: false };
  } catch (e) {
    if (e.message && e.message === 'Queue exists') return { result: true, message: e.message };
    return { error: e };
  }
};

exports.sendMessage = async ({ client, qname = 'vip_tickets', message }) => {
  if (!client) return { error: { message: 'Client is required parameter' } };
  if (message) {
    try {
      return await client.sendMessageAsync({ qname, message });
    } catch (error) {
      return { error };
    }
  }
};

exports.sendMessageToQueue = async ({ message, qname }) => {
  const { error } = await this.createQueue(
    { client: this.rsmqClient, qname },
  );
  if (error) return sentryHelper.captureException(`${qname} create queue error, message: ${message}`);

  const { error: sendingError } = await this.sendMessage(
    { client: this.rsmqClient, message, qname },
  );
  if (sendingError) return sentryHelper.captureException(`${qname} send message to queue error, message: ${message}`);
  return true;
};
