const { faker, getRandomString, App } = require( '../../testHelper' );

const Create = async ( { blacklists, name, admin, moderators, topUsers } ) => {
    const data = {
        name: name || getRandomString( 10 ),
        admin: admin || faker.name.firstName().toLowerCase(),
        moderators: moderators || [],
        topUsers: topUsers || [],
        blacklists: blacklists || { users: [], wobjects: [], posts: [], apps: [] }
    };

    return App.create( data );
};

module.exports = { Create };
