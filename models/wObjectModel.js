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
        await WObjectModel.update({authorPermlink: data.authorPermlink},
            {
                $push:
                    {
                        fields: {
                            name: data.name,
                            body: data.body,
                            weight: 1,
                            locale: data.locale
                        }
                    }
            });
        return {result: true};
    } catch (error) {
        return {error}
    }
};
module.exports = {create, addField};