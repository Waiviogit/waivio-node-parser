const {PostFactory} = require('../../factories');
const {faker, getRandomString} = require('../../testHelper');

const getCreateObjectTypeMocks = () => {
    const metadataWobj = {
        wobj: {
            action: 'createObjectType',
            name: faker.address.city().toLowerCase()
        }
    };
    const op = PostFactory.Create({parent_author: '', additionsForMetadata: metadataWobj, onlyData: true});
    return op;
};

module.exports = {getCreateObjectTypeMocks}
