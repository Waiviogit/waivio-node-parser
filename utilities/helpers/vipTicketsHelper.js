const { Q_NAME, PRICE_FOR_TICKET, POSSIBLE_DISCREPANCY } = require('constants/vipTicketsData');
const redisQueue = require('utilities/redis/rsmq/redisQueue');
const _ = require('lodash');
const config = require('config');

exports.processTicketPurchase = async ({
  from, to, amount, blockNum,
}) => {
  if (!_.includes(['test', 'production'], config.environment)) return false;
  if (amount.includes('HBD')) return false;
  if (!getTicketsAmount(parseFloat(amount))) return false;
  const message = JSON.stringify({
    ticketsAmount: getTicketsAmount(parseFloat(amount)),
    blockNum,
    amount,
    from,
    to,
  });

  return redisQueue.sendMessageToQueue({ message, qname: Q_NAME });
};

const getTicketsAmount = (amount) => {
  if (amount % PRICE_FOR_TICKET === 0) return amount / PRICE_FOR_TICKET;

  return amount % PRICE_FOR_TICKET >= PRICE_FOR_TICKET - POSSIBLE_DISCREPANCY
    ? Math.ceil(amount / PRICE_FOR_TICKET)
    : Math.floor(amount / PRICE_FOR_TICKET);
};
