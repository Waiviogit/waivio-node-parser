const {postsUtil} = require('../utilities/steemApi');
const {Post} = require('../models');
const {Wobj} = require('../models');
const {User} = require('../models');
const {voteFieldHelper} = require('../utilities/helpers');
const {votePostHelper} = require('../utilities/helpers');

const parse = async function (operation) {
    const {post, err} = await postsUtil.getPost(operation.author, operation.permlink);
    if (err) {
        return {};
    }
    let metadata;
    try {                                                       //
        if (post.json_metadata !== '') {                        //
            metadata = JSON.parse(post.json_metadata)           //parse json_metadata from string to JSON
        }                                                       //
    } catch (e) {                                               //
        console.log(e)                                          //
    }                                                           //
    if (post.parent_author === '' && metadata && metadata.wobj) {        //votes for post
        if (metadata.wobj.field) {      //votes for createObject
            await voteCreateAppendObject({
                    author: operation.author,
                    permlink: operation.permlink,
                    voter: operation.voter,
                    percent: operation.percent,
                    author_permlink: operation.permlink
                });
        } else if (metadata.wobj.wobjects) {        //vote for post with wobjects
            await votePostWithObjects({
                post,
                metadata,
                voter: operation.voter,
                percent: operation.weight
            });
        }
    } else if (post.parent_author) {        //votes for comment
        if (metadata && metadata.wobj && metadata.wobj.field) {     //votes for appendObject
            await voteCreateAppendObject({
                author: operation.author,                   //author and permlink - identity of field
                permlink: operation.permlink,
                voter: operation.voter,
                percent: operation.weight,
                author_permlink: post.root_permlink    //author_permlink - identity of wobject
            })
        } else if (await Post.checkForExist(post.root_author, post.root_permlink)) {
            //vote for comment to post with wobjects
            //not implemented
        }
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
        return {};                          //here will be method for checking 7-days expired and increase user weight
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