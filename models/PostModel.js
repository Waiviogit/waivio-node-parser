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

module.exports = {create};