const UserModel = require('../database').models.User;

const create = async function (data) {
    const newUser = new UserModel(data);
    try {
        return {user: await newUser.save()};
    } catch (error) {
        return {error}
    }
};

const addObjectFollow = async function (data) {                 //create user(if it doesn't exist) and update info
    const res = await UserModel.findOneAndUpdate(
        {
            name: data.user                                     //condition
        }, {
            $addToSet: {
                objects_follow: data.author_permlink            //update
            }
        }, {
            upsert: true,
            new: true,                                          //options
            setDefaultsOnInsert: true
        });
    if (!res) {
        return {result: false}
    }
    return {result: true}
};

const removeObjectFollow = async function (data) {          //create user(if it doesn't exist) and update info
    const res = await UserModel.findOneAndUpdate(
        {
            name: data.user                                 //conditions
        }, {
            // name: data.user,
            $pull: {
                objects_follow: data.author_permlink        //update data
            }
        }, {
            upsert: true,
            new: true,                                      //options
            setDefaultsOnInsert: true
        });
    if (!res) {
        return {result: false}
    }
    return {result: true}
};

const checkAndCreate = async function (data) {              //check for existing user and create if not exist
    if (!(await UserModel.count({name: data.name}))) {
        UserModel.create({name: data.name}, (err, user) => {
            if (!err) {
                console.log(`User ${data.name} created!`)
            }
        });
    }
};

const increaseWobjectWeight = async function (data) {
    try {
        await checkAndCreate({name: data.name});                //check for existing user in DB
        await UserModel.updateOne({
            name: data.name,
            w_objects:{
                $not:{
                    $elemMatch:{
                        author_permlink:data.author_permlink
                    }
                }
            }
        },{
            $addToSet: {
                w_objects: {
                    weight: 1,
                    author_permlink: data.author_permlink
                }
            }
        });

        await UserModel.updateOne({
            name: data.name,
            'w_objects.author_permlink': data.author_permlink
        }, {
            $inc: {
                'w_objects.$.weight': data.weight
            }
        });
        return {result: true}
    } catch (error) {
        return {error}
    }
};

const checkForObjectShares = async function (data) {     //object shares - user weight in specified wobject
    try {
        const user = await UserModel.findOne({
            name: data.name,
            'w_objects.author_permlink': data.author_permlink
        })
        // .select('w_objects')
            .lean();
        if (!user) {
            return {error: false}
        }
        return {weight: user.w_objects.find(wobject => wobject.author_permlink === data.author_permlink).weight}
    } catch (error) {
        return {error}
    }
};


module.exports = {create, addObjectFollow, removeObjectFollow, checkAndCreate, increaseWobjectWeight, checkForObjectShares};