const { faker, getRandomString, redisSetter } = require( '../../testHelper' );

const Create = async ( { creator, name, weight, body, root_wobj } = {} ) => {
    const appendObject = {
        name: name || 'city',
        body: body || faker.address.city(),
        locale: 'en-US',
        weight: weight || faker.random.number( 1000 ),
        creator: creator || faker.name.firstName().toLowerCase(),
        author: faker.name.firstName().toLowerCase(),
        permlink: getRandomString( 20 ),
        active_votes: []
    };

    await redisSetter.addAppendWobj( `${appendObject.author }_${ appendObject.permlink}`, root_wobj || getRandomString( 20 ) );
    return { appendObject };
};

module.exports = { Create };
