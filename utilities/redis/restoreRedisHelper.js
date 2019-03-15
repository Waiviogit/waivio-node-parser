const {Wobj, Post} = require('../../models');
const {wobjRefsClient, tagsClient} = require('./redis');
const _ = require('lodash');

const restore = async function () {
    await tagsClient.flushdbAsync();
    await wobjRefsClient.flushdbAsync();
    const {tagsCount} = await restoreWobjTags();
    const {fieldsCount, wobjectsCount} = await restoreAppendWobjects();
    const {postsCount} = await restorePostsWithWobjects();
    return {fieldsCount, wobjectsCount, postsCount, tagsCount}
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
                    await wobjRefsClient.hsetAsync(`${field.field_author}_${field.field_permlink}`, 'type', 'append_wobj');
                    await wobjRefsClient.hsetAsync(`${field.field_author}_${field.field_permlink}`, 'root_wobj', wobject.author_permlink);
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
        for (const post of posts) {
            await wobjRefsClient.hsetAsync(`${post.author}_${post.permlink}`, 'type', 'post_with_wobj');
            await wobjRefsClient.hsetAsync(`${post.author}_${post.permlink}`, 'wobjects', JSON.stringify(post.wobjects));
        }
    }
    return {postsCount}
};

const restoreWobjTags = async function () {
    const {fields: wobject_tags, error} = await Wobj.getSomeFields('tag');
    let tagsCount = 0;
    if (wobject_tags && Array.isArray(wobject_tags) && wobject_tags.length) {
        for (const item of wobject_tags) {
            if (item && _.isString(item.author_permlink) && Array.isArray(item.fields)) {
                item.fields = item.fields.slice(0,100);
                for(const tag of item.fields){
                    await tagsClient.saddAsync(tag, item.author_permlink);
                    tagsCount++;
                }
            }
        }
    }
    return {tagsCount}
};

module.exports = {restore}