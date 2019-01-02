const {Wobj} = require('../../models');
const {User} = require('../../models');
const {Post} = require('../../models');

const voteOnPost = async (data) => {
    if (data.percent === 0) {               //case for unvote
        await unvoteOnPost(data);
    } else {                                //case for upvote
        if (data.percent < 0) {
            await downVoteOnPost(data);
        }
        await upVoteOnPost(data);
    }
    data.post.wobjects = data.metadata.wobj.wobjects;
    data.post.app = data.metadata.app;
    const {result, error} = await Post.update(data.post);     //update post info in DB
};

const unvoteOnPost = async function (data) {
    const {post, error} = await Post.findOne({author: data.post.author, permlink: data.post.permlink});
    if (!post || error) {
        return {}
    }
    const currentVote = post.active_votes.find((vote) => vote.voter === data.voter);
    if (currentVote.weight < 0) {

    } else if (currentVote.weight > 0) {
        
    }
};

const downVoteOnPost = async function (data) {
    //get weight for main vote, take rshares, parse to number and fold back 6 last numbers
    const weight = Number(data.post.active_votes.find((vote) => vote.voter === data.voter).rshares) * 1e-6;

    data.metadata.wobj.wobjects.forEach(async (wObject) => {
        const voteWeight = weight * (wObject.percent / 100);      //calculate vote weight for each wobject in post
        await User.increaseWobjectWeight({
            name: data.post.author,
            author_permlink: wObject.author_permlink,           //increase author weight in wobject
            weight: voteWeight
        });
        console.log(`${data.voter} downvoted for post with ${wObject.author_permlink} object on ${voteWeight} weight\n`);
    });
};

const upVoteOnPost = async function (data) {
    //get vote weight, take rshares, parse to number and fold back 6 last numbers
    const weight = Number(data.post.active_votes.find((vote) => vote.voter === data.voter).rshares) * 1e-6;

    data.metadata.wobj.wobjects.forEach(async (wObject) => {
        const voteWeight = weight * (wObject.percent / 100);      //calculate vote weight for each wobject in post
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
        console.log(`${data.voter} increase his weight in ${wObject.author_permlink} on ${voteWeight}\n`);
    });
    const {result, error} = await Post.update(data.post);     //update post info in DB
};

module.exports = {voteOnPost}