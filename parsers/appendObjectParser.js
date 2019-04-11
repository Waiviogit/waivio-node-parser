const {Wobj} = require('../models');
const {appendObjectValidator} = require('../validator');
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

    const {result, error} = await appendObject(data, operation);
    if (result) {
        console.log(`Field ${metadata.wobj.field.name}, with value: ${metadata.wobj.field.body} added to wobject ${data.author_permlink}!\n`)
    } else if (error)
        console.error(error);
};

const appendObject = async function (data, operation) {
    try {
        await appendObjectValidator.validate(data, operation);
        await redisSetter.addAppendWobj(
            data.field.author + '_' + data.field.permlink,
            data.author_permlink
        );
        const {result, error} = await Wobj.addField(data);
        if (error) {
            throw error;
        }
        // if (data.field.name === 'tag' && data.field.body) {
        //     await redisSetter.addWobjectToTag(data.field.body, data.author_permlink);
        // }
        return {result};

    } catch (error) {
        return {error};
    }
};

module.exports = {parse};
