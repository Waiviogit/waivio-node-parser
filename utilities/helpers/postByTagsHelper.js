const {Wobj} = require('../../models');
const {importObjectsService} = require('../services');
const _ = require('lodash');

const wobjectsByTags = async (tags) => {
    const wobjects = [];
    if (tags && Array.isArray(tags)) {
        for (const tag of _.compact(tags)) {
            let notValidChars = tag.match(/[^a-z0-9\-!?]+/g);
            if(!_.isEmpty(notValidChars)){
                continue;
            }

            let {wobject} = await Wobj.getOne({author_permlink: tag, object_type: 'hashtag'});
            if (wobject) {
                wobjects.push({
                    author_permlink: wobject.author_permlink,
                    percent: 100 / tags.length,
                    tagged: tag
                });
            } else {
                const wobject = {
                    "author_permlink": tag,
                    "object_type": "hashtag",
                    "default_name": tag,
                    "is_extending_open": true,
                    "is_posting_open": true,
                    "creator": "monterey",
                    "fields": []
                };
                await importObjectsService.addWobjectsToQueue({wobjects: [wobject]});
            }
        }
    }
    return wobjects;
};

module.exports = {wobjectsByTags};
