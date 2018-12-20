const WObjectModel = require('../database').models.WObject;

const create = async function (data) {
    const newWObject = new WObjectModel(data);
    try {
        return {wObject: await newWObject.save()};
    } catch (error) {
        return {error}
    }
};

const addField = async function (data) {
    try {
        await WObjectModel.updateOne({author_permlink: data.author_permlink},
            {
                $push:
                    {
                        fields: {
                            name: data.name,
                            body: data.body,
                            locale: data.locale,
                            author: data.author,
                            permlink: data.permlink
                        }
                    }
            });
        return {result: true};
    } catch (error) {
        return {error}
    }
};

const increaseFieldWeight = async function (data) {    //data include: author, permlink, author_permlink, weight
    try {
        await WObjectModel.updateOne({
            author_permlink: data.author_permlink,
            'fields.author': data.author,
            'fields.permlink': data.permlink
        }, {
            $inc: {
                'fields.$.weight': data.weight
            }
        });
        return {result: true}
    } catch (error) {
        return {error}
    }
};

const increaseWobjectWeight = async function (data) {
    try {
        await WObjectModel.updateOne({
            author_permlink: data.author_permlink
        }, {
            $inc: {
                weight: data.weight
            }
        });
        return {result: true}
    } catch (error) {
        return {error}
    }
};

module.exports = {create, addField, increaseFieldWeight, increaseWobjectWeight};