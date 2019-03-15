const {wobjRefsClient, tagsClient} = require('./redis');
const _ = require('lodash');

const addPostWithWobj = async function (author_permlink, wobjects) {
    await wobjRefsClient.hsetAsync(author_permlink, 'type', 'post_with_wobj');
    await wobjRefsClient.hsetAsync(author_permlink, 'wobjects', JSON.stringify(wobjects));
};

const addAppendWobj = async function (author_permlink, root_wobj) {
    await wobjRefsClient.hsetAsync(author_permlink, 'type', 'append_wobj');  //author_permlink is 'author' + '_' + 'permlink' of comment with appendWobject
    await wobjRefsClient.hsetAsync(author_permlink, 'root_wobj', root_wobj); //root_wobj is author_permlink of wobject
};

const addWobjectToTag = async function (tag, author_permlink) {
    if (_.isString(tag) && !_.isEmpty(tag) && _.isString(author_permlink) && !_.isEmpty(author_permlink)) {
        await tagsClient.saddAsync(tag, author_permlink);
    }
};

const setLastBlockNum = async function (blockNum) {
    if (blockNum) {
        await tagsClient.setAsync('last_block_num', blockNum);
    }
};

const updateTagsRefs = async (tags, author_permlink) => {
    if(tags && Array.isArray(tags) && tags.length > 100 && author_permlink){
        for(const tag of tags){
            const res = await tagsClient.sremAsync(tag,author_permlink);
            // console.log(`remove ${author_permlink} from ${tag}: ${res}`);
        }
        tags = tags.slice(0,100);
        for(const tag of tags){
            const res = await tagsClient.saddAsync(tag,author_permlink);
            // console.log(`add ${author_permlink} to ${tag}: ${res}`);
        }
    }
};

module.exports = {addPostWithWobj, addAppendWobj, addWobjectToTag, setLastBlockNum, updateTagsRefs};