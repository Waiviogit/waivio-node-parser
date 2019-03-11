const {getPost} = require('../steemApi/postsUtil');
const {Wobj} = require('../../models');

const voteOnRating = async (author, permlink, author_permlink, ratingVotes = []) => {
    const {post, err} = await getPost(author, permlink);
    if (err || !post) {
        return {error: err}
    }
    const parent_author = post.parent_author;       //id of parent field 'Rating'
    const parent_permlink = post.parent_permlink;   //
    await Wobj.updateField(parent_author, parent_permlink, author_permlink, 'rating_votes', ratingVotes);
};

module.exports = {voteOnRating}