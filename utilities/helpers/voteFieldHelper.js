const {Wobj} = require('../../models');
const {redisSetter} = require('../redis');

const voteOnField = async (data) => {
    await findAndRemoveVote(data);          //case for un-vote
    if (data.percent !== 0) {
        if (data.percent < 0) {
            data.weight = -data.weight;     //case for down-vote
        }
        await addVoteOnField(data);         //case for up-vote
    }
    await handleTagField(data.author, data.permlink, data.author_permlink);

};

const findAndRemoveVote = async (data) => { //data include: author, permlink, author_permlink, voter
    const res = await Wobj.findVote(data);
    if (res && res.weight) {
        await Wobj.increaseFieldWeight({    //if weight is negative - weight will be decreased
            author: data.author,
            permlink: data.permlink,
            author_permlink: data.author_permlink,
            weight: -res.weight
        });
        await Wobj.removeVote(data);
    }
};

const addVoteOnField = async (data) => {
    await Wobj.addVote(data);
    await Wobj.increaseFieldWeight({    //if weight is negative - weight will be decreased
        author: data.author,
        permlink: data.permlink,
        author_permlink: data.author_permlink,
        weight: data.weight
    });
};

const handleTagField = async (author, permlink, author_permlink) => {
    const {field, error} = await Wobj.getField(author, permlink);
    if(field && field.name === 'tag'){
        const {tags} = await Wobj.getWobjectTags(author_permlink);
        if(tags && Array.isArray(tags)){
            await redisSetter.updateTagsRefs(tags, author_permlink);
        }
    }
};

module.exports = {voteOnField}