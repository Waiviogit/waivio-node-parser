const {Wobj} = require('../models');
const {wobjectValidator} = require('../validator');
const {redisSetter} = require('../utilities/redis');

const parse = async function (operation, metadata) {
    const data =
        {
            author_permlink: operation.parent_permlink,
            field: {
                creator: metadata.wobj.creator,
                author: operation.author,
                permlink: operation.permlink
            }
        };
    for (const fieldItem in metadata.wobj.field) {
        data.field[fieldItem] = metadata.wobj.field[fieldItem];
    }

    const res = await appendObject(data);
    if (res) {
        console.log(`Field ${metadata.wobj.field.name}, with value: ${metadata.wobj.field.body} added to wobject ${data.author_permlink}!\n`)
    }
};

const appendObject = async function (data) {
    try {
        if (!wobjectValidator.validateAppendObject(data.field)) {
            throw new Error('Data is not valid');
        }
        await redisSetter.addAppendWobj(
            data.field.author + '_' + data.field.permlink,
            data.author_permlink
        );
        const {result, error} = await Wobj.addField(data);
        if (error) {
            throw error;
        }
        if(data.field.name === 'tag' && data.field.body){
            await redisSetter.addWobjectToTag(data.field.body, data.author_permlink);
        }
        return result;

    } catch (error) {
        throw error;
    }
};

module.exports = {parse};