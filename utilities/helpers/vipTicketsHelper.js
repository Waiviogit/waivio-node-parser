const { redisQueue, rsmqClient } = require('utilities/redis/rsmq');
const { Q_NAME, PRICE_FOR_TICKET, POSSIBLE_DISCREPANCY } = require('constants/vipTicketsData');

exports.processTicketPurchase = async ({
  from, to, amount, blockNum,
}) => {
  if (amount.includes('HBD')) return false;
  if (!getTicketsAmount(parseFloat(amount))) return false;

  return sendMessageToQueue(JSON.stringify({
    ticketsAmount: getTicketsAmount(parseFloat(amount)),
    blockNum,
    amount,
    from,
    to,
  }));
};

const getTicketsAmount = (amount) => {
  if (amount % PRICE_FOR_TICKET === 0) return amount / PRICE_FOR_TICKET;

  return amount % PRICE_FOR_TICKET >= PRICE_FOR_TICKET - POSSIBLE_DISCREPANCY
    ? Math.ceil(amount / PRICE_FOR_TICKET)
    : Math.floor(amount / PRICE_FOR_TICKET);
};

const sendMessageToQueue = async (message) => {
  const { error } = await redisQueue.createQueue(
    { client: rsmqClient, qname: Q_NAME },
  );
  if (error) {

  }
  const { error: sendingError } = await redisQueue.sendMessage({ client: rsmqClient, message });
  if (sendingError) {

  }
  return true;
};
