const {
  redisGetter,
  redisSetter,
} = require('utilities/redis');
const config = require('config');
const { HIVED_NODES } = require('constants/appData');
const { Client } = require('@hiveio/dhive');
const _ = require('lodash');
const axios = require('axios');

let CURRENT_NODE = HIVED_NODES[0];

/**
 * Base method for run stream, for side tasks pass to the key parameter key for save block
 * num in redis, transactionsParserCallback - call back function
 * (it must be switcher for transactions), startFromCurrent - boolean
 * marker for start from the current block
 * @param startFromBlock {Number}
 * @param startFromCurrent {Boolean}
 * @param key {String}
 * @param finishBlock {Number}
 * @param transactionsParserCallback {Function}
 * @returns {Promise<boolean>}
 */
const getBlockNumberStream = async ({
  startFromBlock,
  startFromCurrent,
  key,
  finishBlock,
  transactionsParserCallback,
}) => {
  if (startFromCurrent) {
    const hive = new Client(HIVED_NODES);
    await loadNextBlock(
      {
        key,
        finishBlock,
        transactionsParserCallback,
        startBlock: (await hive.database.getDynamicGlobalProperties()).head_block_number,
      },
    );
  } else if (startFromBlock && Number.isInteger(startFromBlock)) {
    await loadNextBlock({
      startBlock: startFromBlock,
      key,
      finishBlock,
      transactionsParserCallback,
    });
  } else {
    await loadNextBlock({ transactionsParserCallback });
  }
  return true;
};

const getNextBlockNum = async (startBlock, isFirstIteration) => {
  if (isFirstIteration && startBlock) {
    return startBlock;
  }
  return redisGetter.getLastBlockNum();
};

const updateLastBlockNum = async (lastBlockNum, key) => {
  await redisSetter.setLastBlockNum(lastBlockNum + 1, key);
};

const loadNextBlock = async ({
  startBlock,
  key = '',
  finishBlock,
  transactionsParserCallback,
}) => {
  let lastBlockNum;
  let isFirstIteration = true;

  const shouldContinue = (lastBlock, finish) => {
    if (finish) {
      return lastBlock <= finishBlock;
    }
    return true;
  };

  while (shouldContinue(lastBlockNum, finishBlock)) {
    lastBlockNum = await getNextBlockNum(startBlock, isFirstIteration);
    console.time(lastBlockNum);
    const loadResult = await loadBlock(lastBlockNum, transactionsParserCallback);
    console.timeEnd(lastBlockNum);

    if (loadResult) {
      await updateLastBlockNum(lastBlockNum, key);
    } else {
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }

    isFirstIteration = false;
  }
};

// return true if block exist and parsed, else - false
const loadBlock = async (blockNum, transactionsParserCallback) => {
  /*
    To prevent situation when vote parser went further than the main parser,
    check the current block less than last handled on main parser
     */
  if (config.parseOnlyVotes) {
    const lastBlockNumMainParse = await redisGetter.getLastBlockNum('last_block_num');
    if (blockNum >= lastBlockNumMainParse - 3) return false;
  }

  const {
    block,
    error,
  } = await getBlock(blockNum, CURRENT_NODE);

  if (error) {
    console.error(error.message);
    changeNodeUrl();
    return false;
  }
  if (!block) return false;
  if (!block.transactions || !block.transactions[0]) {
    console.error(`EMPTY BLOCK: ${blockNum}`);
    return true;
  }

  await transactionsParserCallback(block.transactions, block.timestamp, blockNum);

  return true;
};

const getBlock = async (blockNum, hiveUrl) => {
  try {
    if (config.parseOnlyVotes) {
      const block = await getBlockREST(blockNum, hiveUrl);
      return { block };
    }

    const hive = new Client(hiveUrl);
    const response = await hive.call('block_api', 'get_block', { block_num: blockNum });

    return { block: response?.block };
  } catch (error) {
    return { error };
  }
};

const getBlockREST = async (blockNum, hiveUrl) => {
  try {
    const instance = axios.create();
    const result = await instance.post(
      hiveUrl,
      getOpsInBlockReqData(blockNum),
    );

    return { transactions: _.get(result, 'data.result.ops') };
  } catch (error) {
    return { error };
  }
};

const getOpsInBlockReqData = (blockNum) => ({
  jsonrpc: '2.0',
  method: 'account_history_api.get_ops_in_block',
  params: {
    block_num: blockNum,
    only_virtual: false,
  },
  id: 1,
});

const changeNodeUrl = () => {
  const index = HIVED_NODES.indexOf(CURRENT_NODE);

  CURRENT_NODE = index === HIVED_NODES.length - 1 ? HIVED_NODES[0] : HIVED_NODES[index + 1];
  console.error(`Node URL was changed to ${CURRENT_NODE}`);
};

module.exports = {
  getBlockNumberStream,
};
