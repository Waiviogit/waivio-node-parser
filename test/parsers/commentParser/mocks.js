const { PostFactory, ObjectTypeFactory } = require( '../../factories' );
const { faker } = require( '../../testHelper' );

const getCreateObjectTypeMocks = () => {
    const metadataWobj = {
        wobj: {
            action: 'createObjectType',
            name: faker.address.city().toLowerCase()
        }
    };
    const op = PostFactory.Create( { parent_author: '', additionsForMetadata: metadataWobj, onlyData: true } );

    return op;
};

const getCreateObjectMocks = async () => {
    const objectType = await ObjectTypeFactory.Create();
    const metadataWobj = {
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
    const op = PostFactory.Create( { parent_author: objectType.author, parent_permlink: objectType.permlink, additionsForMetadata: metadataWobj, onlyData: true } );

    return op;
};

module.exports = { getCreateObjectTypeMocks, getCreateObjectMocks };
