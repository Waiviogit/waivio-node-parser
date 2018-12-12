const {Post} = require('../models');

const parse = async function (operation, metadata) {
    const data = {
        author: operation.author,
        permlink: operation.permlink,
        parent_author: operation.parent_author,
        parent_permlink: operation.parent_permlink,
        title: operation.title,
        body: operation.body,
        json_metadata: operation.json_metadata,
        app: metadata.app,
        wobjects: metadata.wobj.wobjects
    };

    const {post, error} = await createPost(data);
    if (error) {
        console.log(error);
    }
    if (post) {
        console.log(`Post with wobjects created by ${operation.author}`)
    }
};

const createPost = async function (data) {
    //here can be validators for post//
    const {post, error} = await Post.create(data);
    if (error) {
        return {error}
    }
    return {post};
};

module.exports = {parse};
