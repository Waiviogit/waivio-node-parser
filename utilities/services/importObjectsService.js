const {importRsmqClient} = require('../redis/rsmq');
const {sendMessage, receiveMessage, createQueue, deleteMessage} = require('../redis/rsmq/redisQueue');
const _ = require('lodash');

const addWobjectsToQueue = async ({wobjects}) => {

};

const la = {
    "author_permlink": "abc-basic-attention-token",
    "object_type": "trading_tool",
    "default_name": "abc-basic-attention-token",
    "is_extending_open": false,
    "is_posting_open": false,
    "creator": "monterey",
    "fields": [{
        "name":"tag",
        "body":"bat",
        "creator":"monterey",
        "permlink":"lala-tag-bat"
    },{
        "name":"tag",
        "body":"basic-attention-token",
        "creator":"monterey",
        "permlink":"lala-tag-basic-attention-token"
    }]
};
