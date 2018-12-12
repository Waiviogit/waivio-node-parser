const {Wobj} = require('../models');
const {wobjectValidator} = require('../validator');

const parse = async function (operation, metadata) {
    const data =
        {
            author_permlink: operation.parent_author + '_' + operation.parent_permlink,
            author: operation.author,
            permlink: operation.permlink,
            name: metadata.wobj.field.name,
            body: metadata.wobj.field.body,
            locale: metadata.wobj.field.locale
        };
    const res = appendObject(data);
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