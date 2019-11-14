const { faker, getRandomString, App } = require( '../../testHelper' );

const Create = async ( { blacklists, name, admin, moderators, topUsers, author, permlink, title } ) => {
    const data = {
        name: name || getRandomString( 10 ),
        admin: admin || faker.name.firstName().toLowerCase(),
        moderators: moderators || [],
        topUsers: topUsers || [],
        blacklists: blacklists || { users: [], wobjects: [], posts: [], apps: [] },
        daily_chosen_post: {
            author: author || faker.name.firstName().toLowerCase(),
            permlink: permlink || getRandomString(),
            title: title || getRandomString( 20 )
        },
        weekly_chosen_post: {
            author: author || faker.name.firstName().toLowerCase(),
            permlink: permlink || getRandomString(),
            title: title || getRandomString( 20 )
        }
    };

    return App.create( data );
};

module.exports = { Create };
