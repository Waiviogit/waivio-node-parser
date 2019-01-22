const {Wobj, Post} = require('../../models');
const redis = require('./redis');

const restore = async function () {
    const {fieldsCount, wobjectsCount} = await restoreAppendWobjects();
    const {postsCount} = await restorePostsWithWobjects();
    return {fieldsCount, wobjectsCount, postsCount}
};

const restoreAppendWobjects = async function () {
    const {wobjects, error} = await Wobj.getWobjectsRefs();     //get refs(author_permlinks) of all wobjects
    let wobjectsCount = 0;
    let fieldsCount = 0;
    if (wobjects && wobjects.length) {
        wobjectsCount += wobjects.length;
        for (const wobject of wobjects) {
            const {fields, error} = await Wobj.getFieldsRefs(wobject.author_permlink);   //get refs of all fields in wobj
            if (fields && fields.length) {
                fieldsCount += fields.length;
                for (const field of fields) {
                    await redis.hsetAsync(`${field.field_author}_${field.field_permlink}`, 'type', 'append_wobj');
                    await redis.hsetAsync(`${field.field_author}_${field.field_permlink}`, 'root_wobj', wobject.author_permlink);
                }
            }
        }
    }
    return {wobjectsCount, fieldsCount}
};

const restorePostsWithWobjects = async function () {
    const {posts, error} = await Post.getPostsRefs();
    let postsCount = 0;
    if (posts && posts.length) {
        postsCount += posts.length;
        for (const post of posts)
            await redis.hsetAsync(`${post.author}_${post.permlink}`, 'type', 'post_with_wobj');
    }
    return {postsCount}
};

module.exports = {restore}