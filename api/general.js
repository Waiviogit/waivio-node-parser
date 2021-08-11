const { nodeUrls, BLOCK_REQ_MAX_TIME } = require('constants/appData');
const processHelper = require('utilities/helpers/processHelper');
const { redisGetter, redisSetter } = require('utilities/redis');
const { blockUtil } = require('utilities/steemApi');
const { Client } = require('@hiveio/dhive');

const PARSE_ONLY_VOTES = process.env.PARSE_ONLY_VOTES === 'true';
let CURRENT_NODE_URL = nodeUrls[0];

const hive = new Client(nodeUrls);

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
  startFromBlock, startFromCurrent, key, finishBlock,
  transactionsParserCallback,
}) => {
  if (startFromCurrent) {
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
      startBlock: startFromBlock, key, finishBlock, transactionsParserCallback,
    });
  } else {
    await loadNextBlock({ transactionsParserCallback });
  }
  return true;
};

const loadNextBlock = async ({
  startBlock, key = '', finishBlock, transactionsParserCallback,
}) => {
  let lastBlockNum;

  if (startBlock) {
    lastBlockNum = startBlock;
    if (finishBlock && startBlock >= finishBlock) {
      console.log('Task finished');
      return;
    }
  } else {
    lastBlockNum = await redisGetter.getLastBlockNum();
  }
  const loadResult = await loadBlock(lastBlockNum, transactionsParserCallback);

  if (loadResult) {
    await redisSetter.setLastBlockNum(lastBlockNum + 1, key);
    await loadNextBlock({
      startBlock: lastBlockNum + 1, key, transactionsParserCallback, finishBlock,
    });
  } else {
    await new Promise((resolve) => setTimeout(resolve, 2000));
    await loadNextBlock({
      startBlock: lastBlockNum, key, transactionsParserCallback, finishBlock,
    });
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
    if (blockNum >= lastBlockNumMainParse - 1) return false;
  }
  const reqStart = process.hrtime();
  const { block, error } = await blockUtil.getBlock(blockNum, CURRENT_NODE_URL);
  const reqDuration = processHelper.getDurationInMilliseconds(reqStart);

  if (error) {
    console.error(error);
    changeNodeUrl();
    return false;
  }
  if (!block) return false;
  if (!block.transactions || !block.transactions[0]) {
    console.error(`EMPTY BLOCK: ${blockNum}`);
    return true;
  }
  console.time(block.transactions[0].block_num);
  await transactionsParserCallback(block.transactions);
  console.timeEnd(block.transactions[0].block_num);
  if (reqDuration > BLOCK_REQ_MAX_TIME) changeNodeUrl();
  return true;
};

const changeNodeUrl = () => {
  const index = nodeUrls.indexOf(CURRENT_NODE_URL);

  CURRENT_NODE_URL = index === nodeUrls.length - 1 ? nodeUrls[0] : nodeUrls[index + 1];
  console.error(`Node URL was changed to ${CURRENT_NODE_URL}`);
};

module.exports = {
  getBlockNumberStream,
};
