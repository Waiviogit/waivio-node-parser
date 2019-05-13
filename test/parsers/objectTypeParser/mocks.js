const { faker, getRandomString } = require( '../../testHelper' );

const getMockData = () => {
    const operation = {
        parent_author: '',
        parent_permlink: '',
        author: faker.name.firstName().toLowerCase(),
        permlink: `${getRandomString( 3 ) }-${ getRandomString( 8 )}`
    };
    const metadata = {
        app: 'waiviodev',
        community: 'waiviodev',
        wobj: {
            action: 'createObjectType',
            name: faker.address.city().toLowerCase().replace( / /g, '' )
        }
    };

    return { operation, metadata };
};

module.exports = { getMockData };
