const redis = require('./redis');

const addPostWithWobj = async function (author_permlink) {
    await redis.hsetAsync(author_permlink, 'type', 'post_with_wobj');
};

const addAppendWobj = async function (author_permlink, root_wobj) {
    await redis.hsetAsync(author_permlink, 'type', 'append_wobj');  //author_permlink is 'author' + '_' + 'permlink' of comment with appendWobject
    await redis.hsetAsync(author_permlink, 'root_wobj', root_wobj); //root_wobj is author_permlink of wobject
};

module.exports = {addPostWithWobj, addAppendWobj};