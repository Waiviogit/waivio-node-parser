const steem = require('steem');
const {parseSwitcher} = require('../parsers/mainParser');
const bluebird = require('bluebird');
const {redisGetter, redisSetter} = require('../utilities/redis');

bluebird.promisifyAll(steem.api);
steem.api.setOptions({url: 'https://api.steemit.com'});

const getBlockNumberStream = async ({startFromBlock, startFromCurrent}) => {
    if (startFromCurrent)
        loadNextBlock((await steem.api.getDynamicGlobalPropertiesAsync()).head_block_number);
    else if (startFromBlock && Number.isInteger(startFromBlock))
        loadNextBlock(startFromBlock);
    else
        loadNextBlock();
    return true;
};

const getBlockNumbers = async () => {
    const returnData = await blockChain.getBlockNumbers();
    console.log(returnData);
    return returnData;
};

const getCurrentBlock = async () => {
    const returnData = await blockChain.getCurrentBlock();
    return returnData;
};

const loadNextBlock = async (startBlock) => {
    let lastBlockNum;
    if (startBlock)
        lastBlockNum = startBlock;
    else
        lastBlockNum = await redisGetter.getLastBlockNum();
    const loadResult = await loadBlock(lastBlockNum);
    if (loadResult) {
        await redisSetter.setLastBlockNum(lastBlockNum + 1);
        await loadNextBlock();
    } else
        await setTimeout(async () => await loadNextBlock(), 2000);

};

const loadBlock = async (block_num) => { //return true if block exist and parsed, else - false
    let block;
    try {
        block = await steem.api.getBlockAsync(block_num);
    } catch (error) {
        console.error(error);
        return false;
    }
    if (block && block.transactions && block.transactions[0]) {
        console.time(block.transactions[0].block_num);
        await parseSwitcher(block.transactions);
        console.timeEnd(block.transactions[0].block_num);
        return true;
    } else
        return false;
};

module.exports = {
    getBlockNumberStream, getBlockNumbers, getCurrentBlock
};