const { faker } = require( '../../testHelper' );

const Create = ( { author, permlink, voter, weight } ) => {
    const vote = {
        'author': author || faker.name.firstName().toLowerCase(),
        'permlink': permlink || faker.random.string( 25 ),
        'voter': voter || faker.name.firstName().toLowerCase(),
        'weight': weight || 10000
    };

    return { vote };
};

module.exports = { Create };
