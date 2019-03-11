const {Wobj, User} = require('../models');
const {wobjectValidator} = require('../validator');
const {redisSetter} = require('../utilities/redis');

const parse = async function (operation, metadata) {
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
            fields: [{
                name: metadata.wobj.field.name,         //
                body: metadata.wobj.field.body,         //
                locale: metadata.wobj.field.locale,     //this params for initialize first field in wobject
                author: operation.author,               //
                permlink: operation.permlink,           //
                creator: metadata.wobj.creator          //
            }]
        };
    const res = await createObject(data);
    if (res) {
        console.log(`Waivio object ${metadata.wobj.field.body} created!\n`)
    }
};

const createObject = async function (data) {
    try {
        if (!wobjectValidator.validateCreateObject(data)) {
            throw new Error('Data is not valid');
        }
        await redisSetter.addAppendWobj(
            data.author + '_' + data.author_permlink,
            data.author_permlink
        );
        const {wObject, error} = await Wobj.create(data);
        if (error) {
            throw error;
        }
        await User.increaseWobjectWeight({name:data.creator, author_permlink: data.author_permlink, weight: 0});
        return wObject._doc;
    } catch (error) {
        throw error;
    }
};

module.exports = {parse};