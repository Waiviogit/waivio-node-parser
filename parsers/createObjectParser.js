const {Wobj, User} = require('../models');
const {createObjectValidator} = require('../validator');

const parse = async function (operation, metadata) {
    try {
        const data =
            {
                author_permlink: operation.permlink,
                author: operation.author,
                creator: metadata.wobj.creator,
                app: metadata.app,
                community: metadata.community,
                is_posting_open: metadata.wobj.is_posting_open,
                is_extending_open: metadata.wobj.is_extending_open,
                default_name: metadata.wobj.default_name,
                object_type: metadata.wobj.object_type
            };
        const res = await createObject(data);
        if (res) {
            console.log(`Waivio object ${metadata.wobj.field.body} created!\n`)
        }
    } catch (error) {
        console.error(error);
    }
};

const createObject = async function (data, operation) {
    try {
        await createObjectValidator(data, operation);
        const {wObject, error} = await Wobj.create(data);
        if (error) {
            return {error};
        }
        await User.increaseWobjectWeight({name: data.creator, author_permlink: data.author_permlink, weight: 0});
        return wObject._doc;
    } catch (error) {
        return {error};
    }
};

module.exports = {parse};