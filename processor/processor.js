const {api} = require('../api');
const _ = require('lodash');
const {restoreRedisHelper} = require('../utilities/redis');
const {restoreHelper} = require('../utilities/helpers');
const {importObjectsService} = require('../utilities/services');

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

const runStream = async () => {
    try {
        await restoreHelper.restore();
        const result = await restoreRedisHelper.restore();
        if (result) {
            console.log(`Restored ${result.fieldsCount} fields in ${result.wobjectsCount} wobjects and ${result.postsCount} posts with wobjects.\nRestored ${result.tagsCount} tags in wobjects`);
        }
        const transactionStatus = await api.getBlockNumberStream({
            startFromCurrent: true
        });
        if (!transactionStatus) {
            console.log('Data is incorrect or stream is already started!');
        } else {
            console.log('Stream started!');
        }
    } catch (e) {
        console.error(e);
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
        let str = `Restored ${result.fieldsCount} fields in ${result.wobjectsCount} wobjects and ${result.postsCount} posts with wobjects.`;
        str += `\\nRestored ${result.tagsCount} tags in wobjects`;
        str += `\\nRestored ${result.objectTypesCount} Object Types`;
        console.log(str);
        res.status(200).json({message: str})
    }
};

const importWobjects = async (req, res) => {
    const data = {
        wobjects: req.body.wobjects
    };
    const result = await importObjectsService.createWobjects(data);
    if(result){
        //////////////////////////////////lalalallalalalallalalalallalalalalalala
    }
};

module.exports = {
    parseAllBlockChain, runStream, getCurrentBlock, restoreRedis
};
