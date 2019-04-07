const {importRsmqClient} = require('../redis/rsmq');            //redis queue client
const {redisGetter, redisSetter} = require('../redis');         //redis getter and setter for manage wobj data
const {importWobjectsDataClient} = require('../redis').redis;   //client for redis db with wobj data
const objectBotApi = require('../objectBotApi');
const {sendMessage, receiveMessage, createQueue, deleteMessage} = require('../redis/rsmq/redisQueue');
const IMPORT_WOBJECTS_QNAME = 'import_wobjects';

const addWobjectsToQueue = async ({wobjects}) => {

};

const runImportWobjectsQueue = async () => {
    const {result, error: createError} = await createQueue({client: importRsmqClient, qname: IMPORT_WOBJECTS_QNAME});
    if(createError){
        console.error(createError);
    }else if(result){
        while(true){
            const {message, error: receiveError} = await receiveMessage({client: importRsmqClient, qname: IMPORT_WOBJECTS_QNAME});
            if(receiveError){
                if(receiveError.message === 'No messages'){
                    await new Promise(r => setTimeout(r, 1000));
                    continue;
                } else {
                    console.error(receiveError);
                    continue;
                }
            }
            if(message){
                const redisData = await redisGetter.getHashAll(message, importWobjectsDataClient);
                if(redisData){
                    const type = message.split(':')[0];
                    switch (type) {
                        case 'wobj-type':
                            const {error: objBotTypeError} = await objectBotApi.createObjectType(redisData);
                            if(error){
                                console.error(objBotTypeError);
                            }
                            break;
                        case 'wobj':
                            const {error: objBotWobjError} = await objectBotApi.createObject(redisData);
                            if(error){
                                console.error(objBotWobjError);
                            }
                            break;
                        case 'append':
                            const {error: objBotAppendError} = await objectBotApi.appendObject(redisData);
                            if(error){
                                console.error(objBotAppendError);
                            }
                            break;
                    }
                }
            }

        }
    }
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
