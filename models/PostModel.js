const PostModel = require('../database').models.Post;
const User = require('./UserModel');

const create = async function (data) {
    User.checkAndCreate({name: data.author});       //create user in DB if it doesn't exist

    const newPost = new PostModel(data);
    try {
        return {post: await newPost.save()};
    } catch (error) {
        return {error}
    }
};

const findOne = async function (data) {
    try {
        const post = await PostModel.findOne({
            author: data.author,
            permlink: data.permlink
        }).lean();
        return {post}
    } catch (error) {
        return {error}
    }
};

const update = async function (data) {
    try {
        const res = await PostModel.findOneAndUpdate(
            {
                author: data.author,
                permlink: data.permlink
            },
            data,
            {
                upsert: true,
                new: true,
                setDefaultsOnInsert: true
            }
        );
        return {result: !!res}
    } catch (error) {
        return {error}
    }
};

const checkForExist = async function (author, permlink) {
    try {
        const count = PostModel.count({author: author, permlink: permlink});
        return !!count;
    } catch (error) {
        return false;
    }
};

const getPostsRefs = async function(){
    try{
        return {
            posts: await PostModel.aggregate([{
                $project:{
                    _id:0,
                    author:1,
                    permlink:1
                }
            }])
        }
    }  catch (error) {
        return{error}
    }
};

module.exports = {create, update, checkForExist, findOne, getPostsRefs};