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
    if(!(await UserModel.count({name: data.name}))){
        UserModel.create({name: data.name},(err, user)=>{
            if(!err){
                console.log(`User ${data.name} created!`)
            }
        });
    }
};


module.exports = {create, addObjectFollow, removeObjectFollow, checkAndCreate};