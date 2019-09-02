const { redisSetter, ObjectType, faker, getRandomString } = require( '../../testHelper' );

const Create = async ( { name } = {} ) => {
    name = name || getRandomString( 10 );
    const author = faker.name.firstName().toLowerCase();
    const permlink = getRandomString( 15 );
    const objectType = await ObjectType.create( { name, author, permlink } );

    await redisSetter.addObjectType( author, permlink, name );
    return objectType;
};

module.exports = { Create };
