const {redisGetter} = require('../redis');
const _ = require('lodash');

const wobjectsByTags = async (tags) => {
    const wobjects = [];
    if (tags && Array.isArray(tags)) {
        for (const tag of _.compact(tags)) {
            let tagWobjects = await redisGetter.getWobjectsByTag(tag);
            if (tagWobjects && Array.isArray(tagWobjects))
                tagWobjects = tagWobjects.map(wobj => {
                    return {tagged: tag, author_permlink: wobj, percent: 100}
                });
            wobjects.push(...tagWobjects);
        }
    }
    return _.uniqBy(wobjects, 'author_permlink');   //array of objects(author_permlink, tagged, percent)
};

module.exports = {wobjectsByTags}