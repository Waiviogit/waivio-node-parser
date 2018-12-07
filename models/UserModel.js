const UserModel = require('../database').models.User;

const create = async function (data) {
    const newUser = new UserModel(data);
    try {
        return {user: await newUser.save()};
    } catch (error) {
        return {error}
    }
};

const addObjectFollow = async function (data) {
    const res = await UserModel.updateOne({name: data.user},
        {
            $addToSet: {
                objects_follow: data.author_permlink
            }
        }, {new: true});

    if (res.nModified) {
        return {result: true};
    } else {
        return {result: false}
    }
};

const removeObjectFollow = async function (data) {
    const res = await UserModel.updateOne({name: data.user},
        {
            $pull: {
                objects_follow: data.author_permlink
            }
        }).exec();
    if (res.nModified) {
        return {result: true};
    } else {
        return {result: false}
    }
};


module.exports = {create, addObjectFollow, removeObjectFollow};