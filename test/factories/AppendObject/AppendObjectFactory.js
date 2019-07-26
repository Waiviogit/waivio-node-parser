const { faker, getRandomString, redisSetter, WObject } = require( '../../testHelper' );
const ObjectFactory = require( '../../factories/Object/ObjectFactory' );

const Create = async ( { creator, name, weight, body, root_wobj } = {} ) => {
    const appendObject = {
        name: name || 'city',
        body: body || faker.address.city(),
        locale: 'en-US',
        weight: weight || faker.random.number( 1000 ),
        creator: creator || faker.name.firstName().toLowerCase(),
        author: faker.name.firstName().toLowerCase(),
        permlink: getRandomString( 20 ),
        active_votes: []
    };

    root_wobj = root_wobj || `${getRandomString( 3 )}-${faker.address.city().replace( / /g, '' )}`;
    const existWobject = await WObject.countDocuments( { author_permlink: root_wobj } );

    if( !existWobject ) {
        await ObjectFactory.Create( {
            author_permlink: root_wobj,
            fields: [ appendObject ]
        } );
    }
    await WObject.updateOne( { author_permlink: root_wobj }, { $addToSet: { fields: appendObject } } );
    await redisSetter.addAppendWobj( `${appendObject.author }_${ appendObject.permlink}`, root_wobj || getRandomString( 20 ) );
    return { appendObject, root_wobj };
};

module.exports = { Create };
