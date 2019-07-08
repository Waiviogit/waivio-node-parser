const { VoteFactory, PostFactory, ObjectFactory, UserFactory } = require( '../../../factories' );
const { faker } = require( '../../../testHelper' );

const votePostMocks = async() => {
    const wobject1 = await ObjectFactory.Create();
    const wobject2 = await ObjectFactory.Create();
    const { user: user_author } = await UserFactory.Create();
    const { user: user_voter } = await UserFactory.Create();
    const metadata = {
        wobj: {
            wobjects: [ {
                author_permlink: wobject1.author_permlink,
                percent: 50
            }, {
                author_permlink: wobject2.author_permlink,
                percent: 50
            } ]
        }
    };
    const vote = {
        voter: user_voter.name,
        percent: 10000,
        weight: faker.random.number( 1000 ),
        rshares: faker.random.number( 100000000 )

    };
    const post = await PostFactory.Create( {
        author: user_author.name,
        additionsForMetadata: { ...metadata }
    } );

    post.active_votes = [ vote ];

    return { wobjects: [ wobject1, wobject2 ], user_author, user_voter, post, metadata, vote };
};

module.exports = votePostMocks;
