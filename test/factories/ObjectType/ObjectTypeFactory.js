const { ObjectType, faker, getRandomString, commentRefSetter } = require( '../../testHelper' );

const Create = async ( { name, author, permlink, updates_blacklist } = {} ) => {
    const data = {
        name: name || getRandomString( 10 ),
        author: author || faker.name.firstName().toLowerCase(),
        permlink: permlink || getRandomString(),
        updates_blacklist: updates_blacklist || []
    };

    const objectType = await ObjectType.findOneAndUpdate( { name: data.name }, data, { upsert: true, new: true, setDefaultsOnInsert: true } );

    await commentRefSetter.addWobjTypeRef( `${data.author}_${ data.permlink}`, data.name );
    return objectType._doc;
};

module.exports = { Create };
