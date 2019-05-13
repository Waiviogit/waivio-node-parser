const { faker, getRandomString } = require( '../../testHelper' );

const Create = ( { author, permlink, voter, weight } ) => {
    const vote = {
        'author': author || faker.name.firstName().toLowerCase(),
        'permlink': permlink || getRandomString( 25 ),
        'voter': voter || faker.name.firstName().toLowerCase(),
        'weight': weight || 10000
    };

    return { vote };
};

module.exports = { Create };
