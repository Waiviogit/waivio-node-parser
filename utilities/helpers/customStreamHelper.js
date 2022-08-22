const { api } = require('api');
const { redisGetter } = require('utilities/redis');

const runCustomStream = async ({
  key, startBlock, finishBlock, callback,
}) => {
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
      transactionsParserCallback: callback,
    });

    if (!transactionStatus) {
      console.log('Data is incorrect or stream is already started!');
    } else {
      console.log('Stream started!');
    }
  } catch (e) {
    console.error(e.message);
  }
};

module.exports = { runCustomStream };
