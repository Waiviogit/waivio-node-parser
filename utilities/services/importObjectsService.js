const {importRsmqClient} = require('../redis/rsmq');            //redis queue client
const {redisGetter, redisSetter} = require('../redis');         //redis getter and setter for manage wobj data
const {importWobjectsDataClient} = require('../redis').redis;   //client for redis db with wobj data
const objectBotApi = require('../objectBotApi');
const {sendMessage, receiveMessage, createQueue, deleteMessage} = require('../redis/rsmq/redisQueue');
const IMPORT_WOBJECTS_QNAME = 'import_wobjects';

// const addWobjectsToQueue = async ({wobjects}) => {
//
// };

const runImportWobjectsQueue = async () => {
    const {result, error: createError} = await createQueue({client: importRsmqClient, qname: IMPORT_WOBJECTS_QNAME});
    if (createError) {
        console.error(createError);
    } else if (result) {
        while (true) {
            const {message, id: messageId, error: receiveError} = await receiveMessage({
                client: importRsmqClient,
                qname: IMPORT_WOBJECTS_QNAME
            });
            if (receiveError) {
                if (receiveError.message === 'No messages') {
                    await new Promise(r => setTimeout(r, 500));
                    continue;
                } else {
                    console.error(receiveError);
                    continue;
                }
            }
            if (message) {
                const redisData = await redisGetter.getHashAll(message, importWobjectsDataClient);
                if (redisData) {
                    const type = message.split(':')[0];
                    switch (type) {
                        case 'wobj-type':
                            const {error: objBotTypeError} = await objectBotApi.createObjectType.send(redisData);
                            if (objBotTypeError) {
                                console.error(objBotTypeError);
                            } else {
                                await deleteMessage({
                                    client: importRsmqClient,
                                    qname: IMPORT_WOBJECTS_QNAME,
                                    id: messageId
                                });
                                await redisSetter.delImportWobjData(message);

                            }
                            break;

                        case 'wobj':
                            const {error: objBotWobjError} = await objectBotApi.createObject.send(redisData);
                            if (objBotWobjError) {
                                console.error(objBotWobjError);
                            } else {
                                await deleteMessage({
                                    client: importRsmqClient,
                                    qname: IMPORT_WOBJECTS_QNAME,
                                    id: messageId
                                });
                                await redisSetter.delImportWobjData(message);
                                console.log();
                            }
                            break;

                        case 'append':
                            const {error: objBotAppendError} = await objectBotApi.appendObject.send(redisData);
                            if (objBotAppendError) {
                                console.error(objBotAppendError);
                            } else {
                                await deleteMessage({
                                    client: importRsmqClient,
                                    qname: IMPORT_WOBJECTS_QNAME,
                                    id: messageId
                                });
                                await redisSetter.delImportWobjData(message);
                            }
                            break;
                    }
                }
            }

        }
    }
};

module.exports = {
    runImportWobjectsQueue
};
