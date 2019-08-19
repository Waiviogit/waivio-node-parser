const { PostFactory, ObjectFactory, UserFactory } = require( '../../../factories' );
const { faker, ObjectType } = require( '../../../testHelper' );

const votePostMocks = async() => {
    let wobjectsCount = 5;
    let wobjects = [];
    let object_types = [];

    for( let i = 0;i < wobjectsCount;i++ ) {
        const wobject = await ObjectFactory.Create();
        const object_type = await ObjectType.findOne( { name: wobject.object_type } ).lean();

        wobjects.push( wobject );
        object_types.push( object_type );
    }

    const { user: user_author } = await UserFactory.Create();
    const { user: user_voter } = await UserFactory.Create();
    const metadata = {
        wobj: {
            wobjects: wobjects.map( ( w ) => ( { percent: 100 / wobjectsCount, author_permlink: w.author_permlink } ) )
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

    return { wobjects, object_types, user_author, user_voter, post, metadata, vote };
};

module.exports = votePostMocks;
