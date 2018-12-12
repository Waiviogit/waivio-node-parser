const PostModel = require('../database').models.Post;

const create = async function (data) {
    const newPost = new PostModel(data);
    try {
        return {post: await newPost.save()};
    } catch (error) {
        return {error}
    }
};

module.exports = {create};