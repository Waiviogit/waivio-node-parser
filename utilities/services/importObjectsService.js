const {importRsmqClient} = require('../redis/rsmq');            //redis queue client
const {redisGetter, redisSetter} = require('../redis');         //redis getter and setter for manage wobj data
const {importWobjectsDataClient, importWobjectsQueueClient} = require('../redis').redis;   //client for redis db with wobj data
const objectBotApi = require('../objectBotApi');
const redisQueue = require('../redis/rsmq/redisQueue');
const {ObjectType, Wobj} = require('../../models');
const IMPORT_WOBJECTS_QNAME = 'import_wobjects';

const addWobjectsToQueue = async ({wobjects = []} = {}) => {
    for (const wobject of wobjects) {           //check for ex in mongo
        const {objectType: existObjType} = await ObjectType.getOne({name: wobject.object_type});
        if (!existObjType) {                    //check for ex in redis
            const redisExistObjectType = await redisGetter.getHashAll(`wobj-type:${wobject.object_type}`);
            if (!redisExistObjectType) {
                await redisSetter.setImportWobjData(
                    `wobj-type:${wobject.object_type}`,
                    {objectType: wobject.object_type}
                );
                const {error: sendMessError} = await redisQueue.sendMessage({
                    client: importRsmqClient,
                    qname: IMPORT_WOBJECTS_QNAME,
                    message: `wobj-type:${wobject.object_type}`
                });
                if (sendMessError) {
                    console.error(sendMessError);
                }
            }
        }   //handle ObjectType
        const {wobject: existWobj} = await Wobj.getOne({author_permlink: wobject.author_permlink});
        if (!existWobj) {
            const redisExistWobject = await redisGetter.getHashAll(`wobj:${wobject.author_permlink}`);
            if (!redisExistWobject) {
                const data = {
                    objectType: wobject.object_type,
                    permlink: wobject.author_permlink,
                    author: wobject.creator,
                    title: 'Waivio Object',
                    body: `Waivio Object ${wobject.default_name} created!`,
                    objectName: wobject.default_name,
                    locale: 'en-US',
                    isExtendingOpen: wobject.is_extending_open,
                    isPostingOpen: wobject.is_posting_open,
                    parentAuthor: existObjType ? existObjType.author : '',
                    parentPermlink: existObjType ? existObjType.permlink : ''
                };
                await redisSetter.setImportWobjData(`wobj:${wobject.author_permlink}`, data);
                const {error: sendMessError} = await redisQueue.sendMessage({
                    client: importRsmqClient,
                    qname: IMPORT_WOBJECTS_QNAME,
                    message: `wobj:${wobject.author_permlink}`
                });
                if (sendMessError) {
                    console.error(sendMessError);
                }
            }
        }   //handle Wobject
        if (wobject.fields && Array.isArray(wobject.fields)) {
            for (const field of wobject.fields) {
                const {field: existField} = await Wobj.getField(null, field.permlink, wobject.author_permlink);
                if (!existField) {
                    const redisExistField = await redisGetter.getHashAll(`append:${wobject.author_permlink}_${field.permlink}`);
                    if (!redisExistField) {
                        const data = {
                            author: field.creator,
                            permlink: field.permlink,
                            parentPermlink: wobject.author_permlink,
                            parentAuthor: existWobj ? existWobj.author : '',
                            body: `New field "${field.name}" added to Waivio Object "${wobject.parentPermlink}"!`,
                            title: 'New field on wobject',
                            field: JSON.stringify({name: field.name, body: field.body, locale: 'en-US'})
                        };
                        await redisSetter.setImportWobjData(`append:${wobject.author_permlink}_${field.permlink}`, data);
                        const {error: sendMessError} = await redisQueue.sendMessage({
                            client: importRsmqClient,
                            qname: IMPORT_WOBJECTS_QNAME,
                            message: `append:${wobject.author_permlink}_${field.permlink}`
                        });
                        if (sendMessError) {
                            console.error(sendMessError);
                        }
                    }
                }
            }
        }

    }
};

const runImportWobjectsQueue = async () => {
    // await importWobjectsDataClient.flushdbAsync();
    // await importWobjectsQueueClient.flushdbAsync();
    const {result, error: createError} = await redisQueue.createQueue({
        client: importRsmqClient,
        qname: IMPORT_WOBJECTS_QNAME
    });
    if (createError) {
        console.error(createError);
    } else if (result) {
        while (true) {
            const {message, id: messageId, error: receiveError} = await redisQueue.receiveMessage({
                client: importRsmqClient,
                qname: IMPORT_WOBJECTS_QNAME
            });
            if (receiveError) {
                if (receiveError.message === 'No messages') {
                    await new Promise(r => setTimeout(r, 1000));
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
                            await messageCreateWobjType({redisData, messageId});
                            break;

                        case 'wobj':
                            await messageCreateWobj({redisData, messageId});
                            break;

                        case 'append':
                            await messageCreateAppendWobj({redisData, messageId});
                            break;
                    }
                    await redisQueue.deleteMessage({
                        client: importRsmqClient,
                        qname: IMPORT_WOBJECTS_QNAME,
                        id: messageId
                    });
                    await redisSetter.delImportWobjData(message);
                }
            }
        }
    }
};

const messageCreateWobjType = async ({redisData}) => {
    const {error: objBotTypeError} = await objectBotApi.createObjectType.send(redisData);
    if (objBotTypeError) {
        console.error(objBotTypeError.response);
        await redisSetter.setImportWobjData(
            `errored:wobj-type:${redisData.objectType}`,
            redisData
        );
    }
};

const messageCreateWobj = async ({redisData}) => {
    //if parent author and permlink exist use it, else need get it from mongo
    if (!redisData.parentAuthor || !redisData.parentPermlink) {
        let objectType;
        for (let i = 0; i <= 10; i++) {
            let result = await ObjectType.getOne({name: redisData.objectType});
            if (!result || !result.objectType) {
                await new Promise(r => setTimeout(r, 1000));
            } else {
                objectType = result.objectType;
                i = 11; //break the loop
            }
        }
        if (!objectType) {
            console.error(`Object Type ${redisData.objectType} not exist!`);
            await redisSetter.setImportWobjData(
                `errored:wobj:${redisData.permlink}`,
                redisData
            );
            return;
        }

        redisData.parentAuthor = objectType.author;
        redisData.parentPermlink = objectType.permlink;
    }
    const {error: objBotWobjError} = await objectBotApi.createObject.send(redisData);
    if (objBotWobjError) {
        console.error(objBotWobjError);
        await redisSetter.setImportWobjData(
            `errored:append:${redisData.parentPermlink}_${redisData.permlink}`,
            redisData
        );
    }
};

const messageCreateAppendWobj = async ({redisData}) => {
    if (!redisData.parentAuthor) {
        let existWobject;
        for (let i = 0; i <= 10; i++) {
            let result = await Wobj.getOne({author_permlink: redisData.parentPermlink});
            if (!result || !result.wobject) {
                await new Promise(r => setTimeout(r, 1000));
            } else {
                existWobject = result.wobject;
                i = 11; //break the loop
            }
        }
        if (!existWobject) {
            console.error(`Object ${redisData.parentPermlink} not exist!`);
            await redisSetter.setImportWobjData(
                `errored:append:${redisData.parentPermlink}_${redisData.permlink}`,
                redisData
            );
            return;
        }
        redisData.parentAuthor = existWobject.author;
    }
    redisData.field = JSON.parse(redisData.field);
    const {error: objBotAppendError} = await objectBotApi.appendObject.send(redisData);
    if (objBotAppendError) {
        console.error(objBotAppendError.response);
        await redisSetter.setImportWobjData(
            `errored:append:${redisData.parentPermlink}_${redisData.permlink}`,
            redisData
        );
    }
};

module.exports = {
    addWobjectsToQueue,
    runImportWobjectsQueue
};
