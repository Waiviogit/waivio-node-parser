const {postsUtil} = require('../utilities/steemApi');
const {User} = require('../models');
const {voteFieldHelper} = require('../utilities/helpers');
const {votePostHelper} = require('../utilities/helpers');
const redisGetter = require('../utilities/redis/redisGetter');
const parse = async function (operation) {
    const redisResponse = await redisGetter.getHashAll(operation.author + '_' + operation.permlink);
    if(!redisResponse || !redisResponse.type) return;


    if(redisResponse.type==='post_with_wobj') {       //vote for post with wobjects
        const {post, err} = await postsUtil.getPost(operation.author, operation.permlink);
        if (err) {
            return;
        }
        let metadata;
        try {                                                       //
            if (post.json_metadata !== '') {                        //
                metadata = JSON.parse(post.json_metadata)           //parse json_metadata from string to JSON
            }                                                       //
        } catch (e) {                                               //
            console.log(e)                                          //
        }
        if(!metadata) return;
        if(!metadata.wobj){
            metadata.wobj={wobjects:JSON.parse(redisResponse.wobjects)}
        }
        await votePostWithObjects({
            post,
            metadata,
            voter: operation.voter,
            percent: operation.weight
        });
    } else if(redisResponse.type === 'append_wobj' && redisResponse.root_wobj){     //vote for field
        await voteCreateAppendObject({
            author: operation.author,                   //author and permlink - identity of field
            permlink: operation.permlink,
            voter: operation.voter,
            percent: operation.weight,
            author_permlink: redisResponse.root_wobj
        })
    }
};

const voteCreateAppendObject = async function (data) {  //data include: author, permlink, percent, voter, author_permlink
                                                        //author and permlink - identity of field
                                                        //author_permlink - identity of wobject
    let {weight, error} = await User.checkForObjectShares({
        name: data.voter,
        author_permlink: data.author_permlink
    });
    if (weight === undefined || weight <= 0 || error) {     //ignore users with zero or negative weight in wobject
        weight = 1;
    }
    data.weight = weight;
    await voteFieldHelper.voteOnField(data);

    if (data.percent === 0) {
        console.log(`${data.voter} unvote from field in ${data.author_permlink} wobject\n`);
    } else {
        console.log(`${data.voter} vote for field in ${data.author_permlink} wobject with weight ${data.percent > 0 ? weight : -weight}\n`);
    }
};

const votePostWithObjects = async function (data) {         //data include: post, metadata, voter, percent

    await votePostHelper.voteOnPost(data);
    if (data.percent === 0) {
        console.log(`${data.voter} unvote from post @${data.post.author}/${data.post.permlink}\n`);
    } else if (data.percent > 0) {
        console.log(`${data.voter} upvote for post @${data.post.author}/${data.post.permlink}\n`);
    } else if (data.percent < 0) {
        console.log(`${data.voter} downvote on post @${data.post.author}/${data.post.permlink}\n`);
    }
};


module.exports = {parse};