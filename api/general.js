const steem = require('steem');
const bluebird = require('bluebird');
const { nodeUrls } = require('constants/appData');
const { parseSwitcher } = require('parsers/mainParser');
const { redisGetter, redisSetter } = require('utilities/redis');

const PARSE_ONLY_VOTES = process.env.PARSE_ONLY_VOTES === 'true';

bluebird.promisifyAll(steem.api);
steem.api.setOptions({ url: nodeUrls[0] });

const getBlockNumberStream = async ({
  startFromBlock, startFromCurrent, key = '', finishBlock = null,
}) => {
  if (startFromCurrent) {
    await loadNextBlock(
      (await steem.api.getDynamicGlobalPropertiesAsync()).head_block_number, key, finishBlock,
    );
  } else if (startFromBlock && Number.isInteger(startFromBlock)) {
    console.log(startFromBlock);
    await loadNextBlock(startFromBlock, key, finishBlock);
  } else {
    await loadNextBlock();
  }
  return true;
};

const loadNextBlock = async (startBlock, key = '', finishBlock = null) => {
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
  const loadResult = await loadBlock(lastBlockNum, key);

  if (loadResult) {
    await redisSetter.setLastBlockNum(lastBlockNum + 1, key);
    await loadNextBlock(lastBlockNum + 1, key);
  } else {
    await new Promise((resolve) => setTimeout(resolve, 2000));
    await loadNextBlock(lastBlockNum, key);
  }
};

const loadBlock = async (blockNum, task) => { // return true if block exist and parsed, else - false
  let block;

  /*
    To prevent situation when vote parser went further than the main parser,
    check the current block less than last handled on main parser
     */
  if (PARSE_ONLY_VOTES) {
    const lastBlockNumMainParse = await redisGetter.getLastBlockNum('last_block_num');

    if (blockNum >= lastBlockNumMainParse) return false;
  }
  try {
    block = await steem.api.getBlockAsync(blockNum);
  } catch (error) {
    console.error(error);
    changeNodeUrl();
    return false;
  }
  if (!block) {
    return false;
  }
  if (!block.transactions || !block.transactions[0]) {
    console.error(`EMPTY BLOCK: ${blockNum}`);
    return true;
  }
  console.time(block.transactions[0].block_num);
  await parseSwitcher(block.transactions, task);
  console.timeEnd(block.transactions[0].block_num);
  return true;
};

const changeNodeUrl = () => {
  const index = nodeUrls.indexOf(steem.config.url);

  steem.config.url = index === nodeUrls.length - 1 ? nodeUrls[0] : nodeUrls[index + 1];
  // steem.api.setOptions({ url: index === nodeUrls.length - 1 ? nodeUrls[0] : nodeUrls[index + 1] });
  console.error(`Node URL was changed to ${steem.config.url}`);
};

module.exports = {
  getBlockNumberStream,
};
