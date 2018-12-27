const {postsUtil} = require('../utilities/steemApi');
const {Post} = require('../models');
const {Wobj} = require('../models');
const {User} = require('../models');
const {voteHelper} = require('../utilities/helpers');

const parse = async function (operation) {
    if(operation.weight <= 0){
        return {};                      //now we not parse downvotes and unvotes
    }
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
    if (post.parent_author === '') {
        if (metadata && metadata.wobj) {
            if (metadata.wobj.field) {
                await voteCreateAppendObject({
                        author: operation.author,
                        permlink: operation.permlink,
                        voter: operation.voter,
                        author_permlink: operation.author + '_' + operation.permlink
                    }
                )     //vote for post 'createObject' types
            } else if (metadata.wobj.wobjects) {
                await votePostWithObjects({post, metadata, voter: operation.voter});  //vote for post with wobjects
            }
        }
    } else if (post.parent_author) {
        if (metadata && metadata.wobj && metadata.wobj.field) {
            await voteCreateAppendObject({
                author: operation.author,                   //author and permlink - identity of field
                permlink: operation.permlink,
                voter: operation.voter,
                percent: operation.weight,
                author_permlink: post.root_author + '_' + post.root_permlink    //author_permlink - identity of wobject
            })                                                                  //vote for comment 'appendObject' type
        } else if (await Post.checkForExist(post.root_author, post.root_permlink)) {
            //vote for comment to post with wobjects
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
    if (!weight || error) {
        return {};
    }
    data.weight = weight;
    await voteHelper(data);

    // await Wobj.increaseFieldWeight({
    //     author: data.author,
    //     permlink: data.permlink,
    //     author_permlink: data.author_permlink,
    //     weight: weight
    // });
    // console.log(`${data.voter} vote for field in ${data.author_permlink} wobject with weight ${weight}\n`);
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