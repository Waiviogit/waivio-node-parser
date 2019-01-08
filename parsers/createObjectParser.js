const {Wobj} = require('../models');
const {wobjectValidator} = require('../validator');

const parse = async function (operation, metadata){
        const data =
            {
                author_permlink: operation.author + '_' + operation.permlink,
                app: metadata.app,
                object_type: metadata.wobj.object_type,
                community: metadata.community,
                is_posting_open: metadata.wobj.is_posting_open,
                is_extending_open: metadata.wobj.is_extending_open,
                fields: [{
                    name: metadata.wobj.field.name,         //
                    body: metadata.wobj.field.body,         //
                    locale: metadata.wobj.field.locale,     //this params for initialize first field in wobject
                    author: operation.author,               //
                    permlink: operation.permlink,           //
                }]
            };
    const res = createObject(data);
    if (res) {
        console.log(`Waivio object ${metadata.wobj.field.body} created!\n`)
    }
};

const createObject = async function (data) {
    try {
        if (!wobjectValidator.validateCreateObject(data)) {
            throw new Error('Data is not valid');
        }
        const {wObject, error} = await Wobj.create(data);
        if (error) {
            throw error;
        }
        return wObject._doc;
    } catch (error) {
        throw error;
    }
};

module.exports = {parse};