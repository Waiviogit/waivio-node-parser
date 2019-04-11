const {Wobj} = require('../../models');
const {importObjectsService} = require('../services');
const _ = require('lodash');

const wobjectsByTags = async (tags) => {
    const wobjects = [];
    if (tags && Array.isArray(tags)) {
        for (const tag of _.compact(tags)) {
            let {wobject} = await Wobj.getOne({author_permlink: tag, object_type: 'hashtag'});
            if (wobject) {
                wobjects.push({
                    author_permlink: wobject.author_permlink,
                    percent: 100 / tags.length,
                    tagged: tag
                });
            } else {
                const wobject = {
                    "author_permlink": "lala"+tag,
                    "object_type": "testhashtag",
                    "default_name": "lala"+tag,
                    "is_extending_open": true,
                    "is_posting_open": true,
                    "creator": "wiv01",
                    "fields": []
                };
                // console.log("tag created--------------------" + tag);
                await importObjectsService.addWobjectsToQueue({wobjects: [wobject]});
            }
        }
    }
    return wobjects;
};

module.exports = {wobjectsByTags};
