const { User, faker } = require( '../../testHelper' );

const Create = async ( { name = faker.name.firstName() } = {} ) => {
    const user = await User.create( { name } );

    return { user };
};

module.exports = { Create };
