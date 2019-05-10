const { VoteFactory, AppendObject, PostFactory } = require( '../../factories' );

const voteAppendObjectMocks = async () => {
    const { appendObject } = await AppendObject.Create();
    const { vote } = VoteFactory.Create( { author: appendObject.author, permlink: appendObject.permlink } );
    const post = PostFactory.Create( { onlyData: true } );

    post.author = appendObject.author;
    post.permlink = appendObject.permlink;

    return { vote, post };
};

module.exports = { voteAppendObjectMocks };
