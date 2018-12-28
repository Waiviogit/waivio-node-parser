const {Wobj} = require('../../models');

const voteOnField = async (data) => {
    if (data.percent === 0) {               //case for unvote
        await findAndRemoveVote(data);
    } else {                                //case for upvote
        if (data.percent < 0) {
            data.weight = -data.weight;     //case for downvote
        }
        await addVoteOnField(data);
    }
};

const findAndRemoveVote = async (data) => { //data include: author, permlink, author_permlink, voter
    const {weight, error} = await Wobj.findVote(data);
    if(weight){
        await Wobj.increaseFieldWeight({    //if weight is negative - weight will be decreased
            author: data.author,
            permlink: data.permlink,
            author_permlink: data.author_permlink,
            weight: -data.weight
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

module.exports = {voteOnField}