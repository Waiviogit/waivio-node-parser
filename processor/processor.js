const _ = require('lodash');
const { api } = require('api');
const { restoreRedisHelper } = require('utilities/redis');
const { parseSwitcher } = require('parsers/mainParser');
const config = require('config');

const parseAllBlockChain = async (req, res) => {
  try {
    const transactionStatus = await api.getBlockNumbers();

    if (!transactionStatus) {
      res.status(422).json({ error: 'Data is incorrect' });
    } else {
      res.status(200).json();
    }
  } catch (e) {
    res.status(422).json({ error: e.message });
  }
};

const runStream = async () => {
  try {
    console.log(`RESTORE_REDIS: ${config.restoreRedis}`);
    if (config.restoreRedis) {
      const result = await restoreRedisHelper.restore();

      if (result) {
        console.log(`Restored ${result.fieldsCount} fields in ${result.wobjectsCount} wobjects and ${result.postsCount} posts with wobjects.`);
      }
    }
    console.log(`START_FROM_CURRENT: ${config.startFromCurrent}`);

    const transactionStatus = await api.getBlockNumberStream({
      // # param to start parse data from latest block in blockchain
      // # if set to "false" - parsing started from last_block_num(key in redis)
      startFromCurrent: config.startFromCurrent,
      transactionsParserCallback: parseSwitcher,
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

const getCurrentBlock = async (req, res) => {
  try {
    const currentBlockData = await api.getCurrentBlock();

    if (currentBlockData) {
      _.forEach(currentBlockData.transactions, (transaction) => {
        console.log(transaction.operations[0][0]);
        console.log(transaction.operations[0][1]);
      });
      res.status(200).json();
    } else {
      res.status(422).json({ error: 'Data is incorrect' });
    }
  } catch (e) {
    res.status(422).json({ error: e.message });
  }
};

const restoreRedis = async (req, res) => {
  const result = await restoreRedisHelper.restore();

  if (result) {
    let str = `Restored ${result.fieldsCount} fields in ${result.wobjectsCount} wobjects and ${result.postsCount} posts with wobjects.`;

    str += `\\nRestored ${result.objectTypesCount} Object Types`;
    console.log(str);
    res.status(200).json({ message: str });
  }
};

module.exports = {
  parseAllBlockChain, runStream, getCurrentBlock, restoreRedis,
};
