const {
  redisGetter,
  redisSetter,
} = require('utilities/redis');
const blocksUtil = require('utilities/steemApi/blocksUtil');
const { HIVED_NODES } = require('constants/appData');
const { Client } = require('@hiveio/dhive');
const _ = require('lodash');
const axios = require('axios');
const { socketHiveClient } = require('../utilities/socketClient/hiveSocket');

const PARSE_ONLY_VOTES = process.env.PARSE_ONLY_VOTES === 'true';
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
  if (PARSE_ONLY_VOTES) {
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

  await transactionsParserCallback(block.transactions, block.timestamp);

  return true;
};

const timeout = (ms) => new Promise((resolve, reject) => {
  setTimeout(() => {
    reject(new Error(`Timed out in ${ms}ms.`));
  }, ms);
});

const getBlock = async (blockNum, hiveUrl) => {
  try {
    // comment while our node up to 26
    // const resp = await socketHiveClient.getBlock(blockNum);
    // if (!_.get(resp, 'error')) return { block: resp };
    if (PARSE_ONLY_VOTES) {
      const block = await getBlockREST(blockNum, hiveUrl);
      return { block };
    }
    console.log('client create');
    const hive = new Client(hiveUrl);
    console.log('get_block');
    const block = await Promise.race([
      hive.database.call('get_block', [blockNum]),
      timeout(8000),
    ]);
    console.log(' receive get_block');

    return { block };
  } catch (error) {
    return { error };
  }
};

const getBlockREST = async (blockNum, hiveUrl) => {
  try {
    // const resp = await socketHiveClient.getOpsInBlock(blockNum);
    // if (!_.get(resp, 'error')) return { result: resp };
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
