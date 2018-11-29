const dsteem = require('dsteem');
const es = require('event-stream');
const util = require('util');
const {parseSwitcher} = require('../parsers/mainParser');

const opts = {};
//connect to production server
opts.addressPrefix = 'STM';
opts.chainId = '0000000000000000000000000000000000000000000000000000000000000000';

//connect to server which is connected to the network/production
const client = new dsteem.Client('https://api.steemit.com');

const blockChain = new dsteem.Blockchain(client);

const getBlockNumberStream = async () => {
    const stream = client.blockchain.getBlockStream();
    stream.pipe(es.map(function (block, callback) {
        parseSwitcher(block.transactions);
        callback(null, util.inspect(block, {colors: true, depth: null}) + '\n')
    }));
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