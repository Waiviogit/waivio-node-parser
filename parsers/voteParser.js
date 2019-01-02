const {postsUtil} = require('../utilities/steemApi');
const {Post} = require('../models');
const {Wobj} = require('../models');
const {User} = require('../models');
const {voteHelper} = require('../utilities/helpers');

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
    if (post.parent_author === '') {        //votes for post or comment
        if (metadata && metadata.wobj) {
            if (metadata.wobj.field) {      //votes for createObject or post with objects
                await voteCreateAppendObject({
                        author: operation.author,
                        permlink: operation.permlink,
                        voter: operation.voter,
                        percent: operation.percent,
                        author_permlink: operation.author + '_' + operation.permlink
                    }
                )     //vote for post 'createObject' types
            } else if (metadata.wobj.wobjects) {
                await votePostWithObjects({post, metadata, voter: operation.voter});  //vote for post with wobjects
            }
        }
    } else if (post.parent_author) {        //votes for comment
        if (metadata && metadata.wobj && metadata.wobj.field) {     //votes for appendObject
            await voteCreateAppendObject({
                author: operation.author,                   //author and permlink - identity of field
                permlink: operation.permlink,
                voter: operation.voter,
                percent: operation.weight,
                author_permlink: post.root_author + '_' + post.root_permlink    //author_permlink - identity of wobject
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
    if (weight === undefined || error) {
        return {};                          //here will be method for checking 7-days expired and increase user weight
    }
    data.weight = weight;
    await voteHelper.voteOnField(data);

    if (data.percent === 0) {
        console.log(`${data.voter} unvote from field in ${data.author_permlink} wobject\n`);
    } else {
        console.log(`${data.voter} vote for field in ${data.author_permlink} wobject with weight ${data.percent > 0 ? weight : -weight}\n`);
    }
};

const votePostWithObjects = async function (data) {         //data include: post, metadata, voter
    data.post.wobjects = data.metadata.wobj.wobjects;
    data.post.app = data.metadata.app;
    let {result, error} = await Post.update(data.post);     //update post info in DB
    const weight = data.post.active_votes.find((vote) => vote.voter === data.voter).weight; //get vote weight

    data.metadata.wobj.wobjects.forEach(async (wObject) => {
        let voteWeight = weight * (wObject.percent / 100);      //calculate vote weight for each wobject in post
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
};


module.exports = {parse};