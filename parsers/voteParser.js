const {postsUtil} = require('../utilities/steemApi');
const {Post} = require('../models');
const {Wobj} = require('../models');
const {User} = require('../models');

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
    if (post.parent_author === '') {
        if (metadata && metadata.wobj) {
            if (metadata.wobj.field) {
                //vote for 'createObject'
            } else if (metadata.wobj.wobjects) {
                await votePostWithObjects({post, metadata, voter: operation.voter});  //vote for post with wobjects
            }
        }
    } else if (post.parent_author) {
        if (metadata && metadata.wobj && metadata.wobj.field) {
            //vote for 'appendObject'
        } else if (await Post.checkForExist(post.root_author, post.root_permlink)) {
            //vote for comment to post with wobjects
        }
    }
};

const voteCreateAppendObject = async function (data) {      //data include: author_permlink, author, permlink, weight

};

const votePostWithObjects = async function (data) {         //data include: post, metadata, voter
    data.post.wobjects = data.metadata.wobj.wobjects;
    data.post.app = data.metadata.app;
    let {result, error} = await Post.update(data.post);     //update post info in DB
    const weight = data.post.active_votes.find((vote) => vote.voter === data.voter).weight; //get vote weight

    data.metadata.wobj.wobjects.forEach(async (wObject) => {
        let voteWeight = weight * (wObject.percent / 100);      //calculate vote weight for each wobject in post
        await Wobj.incrementWobjectWeight({
            author_permlink: wObject.author_permlink,           //increment wobject weight
            weight: voteWeight
        });
        await User.incrementWobjectWeight({
            name: data.post.author,
            author_permlink: wObject.author_permlink,           //increment author weight in wobject
            weight: voteWeight
        });
        if (data.voter !== data.post.author) {
            await User.incrementWobjectWeight({
                name: data.voter,
                author_permlink: wObject.author_permlink,       //increment voter weight in wobject if he isn't author
                weight: voteWeight
            });
        }
        console.log(`${data.voter} increase his weight in ${wObject.author_permlink} on ${voteWeight}\n`);
    });
};


module.exports = {parse};