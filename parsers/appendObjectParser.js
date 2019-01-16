const {Wobj} = require('../models');
const {wobjectValidator} = require('../validator');

const parse = async function (operation, metadata) {
    const data =
        {
            author_permlink: operation.parent_permlink,
            author: operation.author,
            creator: metadata.wobj.creator,
            permlink: operation.permlink
        };
    for(const fieldItem in metadata.wobj.field){
        data[fieldItem] = metadata.wobj.field[fieldItem];
    }

    const res = await appendObject(data);
    if (res) {
        console.log(`Field ${metadata.wobj.field.name}, with value: ${metadata.wobj.field.body} added to wobject ${data.author_permlink}!\n`)
    }
};

const appendObject = async function (data) {
    try {
        if (!wobjectValidator.validateAppendObject(data)) {
            throw new Error('Data is not valid');
        }
        const {result, error} = await Wobj.addField(data);
        if (error) {
            throw error;
        }
        return result;

    } catch (error) {
        throw error;
    }
};

module.exports = {parse};