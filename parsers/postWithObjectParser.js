const {Post} = require('../models');
const {postsUtil} = require('../utilities/steemApi');
const {User} = require('../models');

const parse = async function (operation) {
    const data = {
        author: operation.author,
        permlink: operation.permlink
    };

    User.checkAndCreate({name: operation.author});

    const {result, error} = await createOrUpdatePost(data);
    if (error) {
        console.log(error);
    }
    if (result) {
        console.log(`Post with wobjects created by ${operation.author}`)
    }
};

const createOrUpdatePost = async function (data) {
    const {post, err} = await postsUtil.getPost(data.author, data.permlink);
    if (err) {
        return {error: err}
    }
    //here can be validators for post//
    const {result, error} = await Post.update(post);
    if (error) {
        return {error}
    }
    return {result};
};


module.exports = {parse};
