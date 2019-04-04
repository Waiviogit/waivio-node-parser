const {ObjectFactory} = require('../../factories');
const {faker, getRandomString} = require('../../testHelper');

const getMocksData = async () => {
    const wobject = await ObjectFactory.Create();

    const operation = {
        parent_author: wobject.author,
        parent_permlink: wobject.author_permlink,
        author: faker.name.firstName().toLowerCase(),
        permlink: getRandomString(15),

    };
    const metadata = {
        app: 'waiviotest',
        community: 'waiviodev',
        wobj: {
            creator: faker.name.firstName().toLowerCase(),
            action: 'appendObject',
            field: {
                name: 'name',
                body: faker.address.city(),
                locale: faker.random.locale()
            }
        }
    };
    return {wobject, operation, metadata}
};

module.exports = {getMocksData}