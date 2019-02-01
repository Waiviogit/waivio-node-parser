const {Wobj} = require('../../models');
const {User} = require('../../models');
const {Post} = require('../../models');

const voteOnPost = async (data) => {
    //calculated value, for using in wobject environment
    const currentVote = data.post.active_votes.find((vote) => vote.voter === data.voter);
    if(!currentVote){
        console.log(data.post.active_votes);
        console.log(data.voter);
        return;
    }
    const weight = Math.round((data.post.active_votes.find((vote) => vote.voter === data.voter).rshares) * 1e-6);
    if (data.percent === 0) {               //case for un-vote
        await unvoteOnPost(data);
    } else {
        if (data.percent < 0) {
            await unvoteOnPost(data);       //if down-vote right after up-vote, need first undo all changes by up-vote
            await downVoteOnPost(data, weight);     //case for down-vote
        } else if (data.percent > 0) {
            await unvoteOnPost(data);       //if up-vote right after down-vote, need first undo all changes by down-vote
            await upVoteOnPost(data, weight);       //case for up-vote
        }
    }
    data.post.wobjects = data.metadata.wobj.wobjects;
    data.post.app = data.metadata.app;
    data.post.active_votes = data.post.active_votes.map((vote) => {
        return {
            voter: vote.voter,
            weight: Math.round(vote.rshares * 1e-6),
            percent: vote.percent
        }
    });
    await Post.update(data.post);     //update post info in DB
};


const unvoteOnPost = async function (data) {    //method also using as undo previous vote before up- or down-vote
    const {post, error} = await Post.findOne({author: data.post.author, permlink: data.post.permlink});
    if (!post || error) {
        return {}
    }
    const existingVote = post.active_votes.find((vote) => vote.voter === data.voter);
    if (existingVote) {
        if (existingVote.weight < 0) {   //if un-vote after down-vote, need increase only author weight in wobjects
            await downVoteOnPost(data, -existingVote.weight);
        } else if (existingVote.weight > 0) {    //if un-vote after up-vote, need decrease author, voter and wobject weights
            await upVoteOnPost(data, -existingVote.weight);
        }
    }
};

const downVoteOnPost = async function (data, weight) {
    data.metadata.wobj.wobjects.forEach(async (wObject) => {
        const voteWeight = weight * (wObject.percent / 100);      //calculate vote weight for each wobject in post
        await User.increaseWobjectWeight({
            name: data.post.author,
            author_permlink: wObject.author_permlink,           //decrease author weight in wobject
            weight: voteWeight
        });
    });
};

const upVoteOnPost = async function (data, weight) {
    for(const wObject of data.metadata.wobj.wobjects){
    // data.metadata.wobj.wobjects.forEach(async (wObject) => {
        const voteWeight = weight * (wObject.percent / 100);    //calculate vote weight for each wobject in post
        await Wobj.increaseWobjectWeight({
            author_permlink: wObject.author_permlink,           //increase wobject weight
            weight: voteWeight
        });
        await User.increaseWobjectWeight({
            name: data.post.author,
            author_permlink: wObject.author_permlink,           //increase author weight in wobject
            weight: voteWeight
        });
        if (data.voter !== data.post.author) {
            await User.increaseWobjectWeight({
                name: data.voter,
                author_permlink: wObject.author_permlink,       //increase voter weight in wobject if he isn't author
                weight: voteWeight
            });
        }
    }
};

module.exports = {voteOnPost}