const { WObject, faker, getRandomString, redisSetter } = require( '../../testHelper' );
const ObjectTypeFactory = require( '../ObjectType/ObjectTypeFactory' );

const Create = async ( { onlyData, appends = [], author_permlink: root_permlink, object_type } = {} ) => {
    const created_object_type = await ObjectTypeFactory.Create( { name: object_type } );
    const default_name = faker.address.city().toLowerCase();
    const is_posting_open = true;
    const is_extending_open = true;
    const creator = faker.name.firstName().toLowerCase();
    const author = faker.name.firstName().toLowerCase();
    const author_permlink = root_permlink || `${getRandomString( 3 )}-${default_name.replace( / /g, '' )}`;
    object_type = created_object_type.name;

    if ( onlyData ) {
        return {
            author_permlink,
            author,
            creator,
            is_extending_open,
            is_posting_open,
            object_type,
            default_name
        };
    }
    const wobject = await WObject.create( {
        author_permlink,
        author,
        creator,
        is_extending_open,
        is_posting_open,
        object_type,
        default_name,
        fields: [ ...appends ]
    } );

    await redisSetter.addWobjRef( `${author}_${author_permlink}`, author_permlink );
    return wobject._doc;
};

module.exports = { Create };
