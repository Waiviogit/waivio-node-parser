const { api } = require('api');
const { redisGetter } = require('utilities/redis');
const { usersParseSwitcher } = require('./parser');

const runUserStream = async ({ key, startBlock, finishBlock }) => {
  try {
    if (!startBlock) {
      startBlock = await redisGetter.getLastBlockNum(key);
    }
    console.log(`START_FROM_BLOCK: ${startBlock}`);
    const transactionStatus = await api.getBlockNumberStream({
      startFromBlock: startBlock,
      startFromCurrent: false,
      key,
      finishBlock,
      transactionsParserCallback: usersParseSwitcher,
    });

    if (!transactionStatus) {
      console.log('Data is incorrect or stream is already started!');
    } else {
      console.log('Stream started!');
    }
  } catch (e) {
    console.error(e);
  }
};

module.exports = { runUserStream };
