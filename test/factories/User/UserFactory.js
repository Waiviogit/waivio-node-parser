const { User, faker } = require( '../../testHelper' );

const Create = async ( { name, wobjects_weight, users_follow, objects_follow } = {} ) => {
    let userName = name || faker.name.firstName().toLowerCase();
    const existUser = await User.findOne( { name: userName } ).lean();

    if( existUser ) return { user: existUser };
    const user = await User.create( {
        name: userName,
        wobjects_weight: wobjects_weight || 0,
        users_follow: users_follow || [],
        objects_follow: objects_follow || []
    } );

    return { user: user.toObject() };
};

module.exports = { Create };
