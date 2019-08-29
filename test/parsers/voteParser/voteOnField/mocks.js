const { VoteFactory, AppendObject, UserFactory } = require( '../../../factories' );

const voteAppendObjectMocks = async () => {
    const { user: creator } = await UserFactory.Create();
    const { user: voter } = await UserFactory.Create();
    const { appendObject, root_wobj } = await AppendObject.Create( { creator: creator.name } );
    const { vote } = VoteFactory.Create( { author: appendObject.author, permlink: appendObject.permlink, voter: voter.name } );

    vote.percent = vote.weight;
    delete vote.weight;

    return { vote, appendObject, author_permlink: root_wobj, creator, voter };
};

module.exports = { voteAppendObjectMocks };
