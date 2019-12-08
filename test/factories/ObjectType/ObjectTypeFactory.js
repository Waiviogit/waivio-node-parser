const { ObjectType, faker, getRandomString, commentRefSetter } = require( '../../testHelper' );

const Create = async ( { name, author, permlink, updates_blacklist, supposed_updates } = {} ) => {
    const data = {
        name: name || getRandomString( 10 ),
        author: author || faker.name.firstName().toLowerCase(),
        permlink: permlink || getRandomString()
    };
    if( updates_blacklist ) data.updates_blacklist = updates_blacklist;
    if( supposed_updates ) data.supposed_updates = supposed_updates;

    const objectType = await ObjectType.findOneAndUpdate( { name: data.name }, data, { upsert: true, new: true, setDefaultsOnInsert: true } );

    await commentRefSetter.addWobjTypeRef( `${data.author}_${ data.permlink}`, data.name );
    return objectType._doc;
};

module.exports = { Create };
