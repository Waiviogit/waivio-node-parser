const { faker, getRandomString, UserWobjects } = require( '../../testHelper' );

const Create = async ( { user_name, author_permlink, weight } = {} ) => {
    const data = {
        user_name: user_name || getRandomString(),
        author_permlink: author_permlink || getRandomString(),
        weight: weight || faker.random.number()
    };
    const userWobject = await UserWobjects.create( data );

    return userWobject._doc;
};


module.exports = { Create };
