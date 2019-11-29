const { ObjectType, faker, getRandomString, commentRefSetter } = require( '../../testHelper' );

const Create = async ( { name, author, permlink, updates_blacklist } = {} ) => {
    const data = {
        name: name || getRandomString( 10 ),
        author: author || faker.name.firstName().toLowerCase(),
        permlink: permlink || getRandomString(),
        updates_blacklist: updates_blacklist || []
    };

    const objectType = await ObjectType.create( data );

    await commentRefSetter.addWobjTypeRef( `${data.author}_${ data.permlink}`, data.name );
    return objectType;
};

module.exports = { Create };
