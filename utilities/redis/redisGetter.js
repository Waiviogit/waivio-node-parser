const redis = require('./redis');

const getHashAll = async function(author_permlink){
    const res = await redis.hgetallAsync(author_permlink);
    return res;
};

module.exports={getHashAll}