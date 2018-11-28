const dsteem = require('dsteem');
const es = require('event-stream');
const util = require('util');
const { parseSwitcher } = require('../parsers/main');
const { PrivateKey } = require('dsteem');

const opts = {};

//connect to production server
opts.addressPrefix = 'STM';
opts.chainId = '0000000000000000000000000000000000000000000000000000000000000000';

//connect to server which is connected to the network/production
const client = new dsteem.Client('https://api.steemit.com');
const blockChain = new dsteem.Blockchain(client);

    const getBlockNumberStream = async () => {
        const stream = client.blockchain.getBlockStream();
        stream.pipe(es.map(function(block, callback) {
            parseSwitcher(block.transactions);
            callback(null, util.inspect(block, {colors: true, depth: null}) + '\n')
        }));
        return {};
    };
    // const getBlockNumberStream = async () => {
    //     const returnData = await blockChain.getBlockNumberStream();
    //     console.log(returnData);
    //     return returnData;
    // };
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

  const createPost = async (comment, options, key) => {
        console.log('comment:', comment);
        console.log('options:', options);
        const returnData = await client.broadcast.commentWithOptions(comment, options, key);
        return returnData;
    };

  const votePost = async (payload) => {
        console.log('client.broadcast.upvote:', payload.payload);
        const returnData = await client.broadcast.vote(payload.payload, payload.privateKey);
        return returnData;
    };

  const followUser = async (userName) => {

  };

module.exports = {
    createPost, votePost, getBlockNumberStream, getBlockNumbers, getCurrentBlock, followUser
};