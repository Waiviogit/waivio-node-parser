const {postRefsClient, tagsClient} = require('./redis');

const getHashAll = async function (key, client = postRefsClient) {
    const res = await client.hgetallAsync(key);
    return res;
};

const getWobjectsByTag = async function (tag) {
    if (!tag) return;
    const wobjects = await tagsClient.smembersAsync(tag);
    return wobjects;
};

const getLastBlockNum = async function () {
    const num = await tagsClient.getAsync('last_block_num');
    return num ? parseInt(num) : process.env.START_FROM_BLOCK || 29937113
};

module.exports = {getHashAll, getWobjectsByTag, getLastBlockNum}