const steem = require('steem');
const {parseSwitcher} = require('../parsers/mainParser');

//connect to server which is connected to the network/production
steem.api.setOptions({url: 'https://api.steemit.com'});

const getBlockNumberStream = async () => {
    steem.api.streamBlock('head', async function (err, block) {
        if(block) await parseSwitcher(block.transactions);
    });
    return {};
};

const getBlockNumbers = async () => {
    const returnData = await blockChain.getBlockNumbers();
    console.log(returnData);
    return returnData;
};

const getCurrentBlock = async () => {
    const returnData = await blockChain.getCurrentBlock();
    // console.log(returnData);
    return returnData;
};

module.exports = {
    getBlockNumberStream, getBlockNumbers, getCurrentBlock
};