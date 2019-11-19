const { User, faker } = require( '../../testHelper' );

const Create = async ( { name = faker.name.firstName(), wobjects_weight = 0, users_follow = [] } = {} ) => {
    const existUser = await User.findOne( { name } ).lean();

    if( existUser ) return { user: existUser };
    const user = await User.create( { name: name, wobjects_weight: wobjects_weight, users_follow: users_follow } );

    return { user: user._doc };
};

module.exports = { Create };
