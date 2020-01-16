const { faker, Comment } = require( '../../testHelper' );

const Create = async ( { author, permlink, parent_author, parent_permlink, root_author, root_permlink, guestInfo, active_votes, onlyData } = {} ) => {
    const comment = {
        author: author || faker.name.firstName().toLowerCase(),
        permlink: permlink || faker.random.string( 20 ),
        parent_author: parent_author || faker.name.firstName().toLowerCase(),
        parent_permlink: parent_permlink || faker.random.string( 20 ),
        root_author: root_author || faker.name.firstName().toLowerCase(),
        root_permlink: root_permlink || faker.random.string( 20 ),
        active_votes: active_votes || [],
        guestInfo: guestInfo || null
    };
    // return only data, but not create into database
    if ( onlyData ) return comment;

    const new_comment = await Comment.create( comment );
    return new_comment.toObject();
};

module.exports = { Create };
