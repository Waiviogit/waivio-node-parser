const {api} = require('../api');
const _ = require('lodash');
const {restoreRedisHelper, redisGetter, redisSetter} = require('../utilities/redis');

const parseAllBlockChain = async (req, res) => {
    try {
        const transactionStatus = await api.getBlockNumbers();
        if (!transactionStatus) {
            res.status(422).json({error: 'Data is incorrect'})
        } else {
            res.status(200).json();
        }
    } catch (e) {
        res.status(422).json({error: e.message})
    }
};

const runStream = async (req, res) => {
    try {
        const isStarted = await redisGetter.getParserStarted();
        if (isStarted) {
            res.status(422).json({error: 'Stream is already started!'});
            return
        } else
            await redisSetter.setParserStarted(1);

        const result = await restoreRedisHelper.restore();
        if (result) {
            console.log(`Restored ${result.fieldsCount} fields in ${result.wobjectsCount} wobjects and ${result.postsCount} posts with wobjects.\nRestored ${result.tagsCount} tags in wobjects`);
        }
        const transactionStatus = await api.getBlockNumberStream({
            startFromBlock: req.body.startFromBlock,
            startFromCurrent: req.body.startFromCurrent
        });
        if (!transactionStatus) {
            res.status(422).json({error: 'Data is incorrect or stream is already started!'})
        } else {
            console.log('Start stream!');
            res.status(200).json({'message': 'Stream started!'});
        }
    } catch (e) {
        res.status(422).json({error: e.message})
    }
};
const getCurrentBlock = async (req, res) => {
    try {
        const currentBlockData = await api.getCurrentBlock();
        if (currentBlockData) {
            _.forEach(currentBlockData.transactions, transaction => {
                console.log(transaction.operations[0][0]);
                console.log(transaction.operations[0][1]);
            });
            res.status(200).json();
        } else {
            res.status(422).json({error: 'Data is incorrect'})

        }
    } catch (e) {
        res.status(422).json({error: e.message})
    }
};

const restoreRedis = async (req, res) => {
    const result = await restoreRedisHelper.restore();
    if (result) {
        const str = `Restored ${result.fieldsCount} fields in ${result.wobjectsCount} wobjects and ${result.postsCount} posts with wobjects.\nRestored ${result.tagsCount} tags in wobjects`;
        console.log(str);
        res.status(200).json({message: str})
    }
};


module.exports = {
    parseAllBlockChain, runStream, getCurrentBlock, restoreRedis
};