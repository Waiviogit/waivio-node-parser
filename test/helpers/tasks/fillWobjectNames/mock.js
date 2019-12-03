const { faker, getRandomString } = require( '../../../testHelper' );

module.exports = ( empty ) => {
    if ( empty ) return [ ];
    return [
        {
            author_permlink: getRandomString(),
            author: faker.name.firstName(),
            default_name: faker.name.firstName()
        }
    ];
};
