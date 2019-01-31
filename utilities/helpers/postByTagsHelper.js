const {redisGetter} = require('../redis');
const _ = require('lodash');

const wobjectsByTags = async (tags) => {
    const wobjects = [];
    if (tags && Array.isArray(tags)) {
        for (const tag of tags) {
            const tagWobjects = await redisGetter.getWobjectsByTag(tag);
            if (tagWobjects && Array.isArray(tagWobjects))
                wobjects.push(...tagWobjects);
        }
    }
    return _.uniq(wobjects);
};

module.exports = {wobjectsByTags}