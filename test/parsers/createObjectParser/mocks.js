const { ObjectTypeFactory } = require( '../../factories' );
const { faker, getRandomString } = require( '../../testHelper' );

const getMocksData = async () => {
    const objectType = await ObjectTypeFactory.Create();

    const operation = {
        parent_author: objectType.author,
        parent_permlink: objectType.permlink,
        author: faker.name.firstName().toLowerCase(),
        permlink: getRandomString( 15 )

    };
    const metadata = {
        app: 'waiviotest',
        community: 'waiviodev',
        wobj: {
            creator: faker.name.firstName().toLowerCase(),
            action: 'createObject',
            is_posting_open: true,
            is_extending_open: true,
            default_name: faker.address.city()
        }
    };

    return { objectType, operation, metadata };
};

module.exports = { getMocksData };
