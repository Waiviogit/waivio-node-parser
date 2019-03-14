const {Wobj, User} = require('../models');
const {wobjectValidator} = require('../validator');

const parse = async function (operation, metadata) {
    try {
        const data =
            {
                author_permlink: operation.permlink,
                author: operation.author,
                creator: metadata.wobj.creator,
                app: metadata.app,
                object_type: metadata.wobj.object_type,
                community: metadata.community,
                is_posting_open: metadata.wobj.is_posting_open,
                is_extending_open: metadata.wobj.is_extending_open,
                default_name: metadata.wobj.field.body,
                fields: []
            };
        const res = await createObject(data);
        if (res) {
            console.log(`Waivio object ${metadata.wobj.field.body} created!\n`)
        }
    } catch (error) {
        console.error(error);
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
        await User.increaseWobjectWeight({name: data.creator, author_permlink: data.author_permlink, weight: 0});
        return wObject._doc;
    } catch (error) {
        throw error;
    }
};

module.exports = {parse};