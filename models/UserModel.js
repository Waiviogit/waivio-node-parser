const UserModel = require( '../database' ).models.User;
const UserWobjectsModel = require( '../database' ).models.UserWobjects;

const create = async function ( data ) {
    const newUser = new UserModel( data );

    try {
        return { user: await newUser.save() };
    } catch ( error ) {
        return { error };
    }
};

const addObjectFollow = async function ( data ) { // create user(if it doesn't exist) and update info
    const res = await UserModel.findOneAndUpdate(
        {
            name: data.user // condition
        }, {
            $addToSet: {
                objects_follow: data.author_permlink // update
            }
        }, {
            upsert: true,
            new: true, // options
            setDefaultsOnInsert: true
        } );

    if ( !res ) {
        return { result: false };
    }
    return { result: true };
};

const removeObjectFollow = async function ( data ) { // create user(if it doesn't exist) and update info
    const res = await UserModel.findOneAndUpdate(
        {
            name: data.user // conditions
        }, {
            // name: data.user,
            $pull: {
                objects_follow: data.author_permlink // update data
            }
        }, {
            upsert: true,
            new: true, // options
            setDefaultsOnInsert: true
        } );

    if ( !res ) {
        return { result: false };
    }
    return { result: true };
};

const addUserFollow = async function ( { follower, following } ) {
    const res = await UserModel.findOneAndUpdate(
        {
            name: follower // condition
        }, {
            $addToSet: {
                users_follow: following// update
            }
        } );

    if ( !res ) {
        return { result: false };
    }
    return { result: true };
};

const removeUserFollow = async function ( { follower, following } ) {
    const res = await UserModel.findOneAndUpdate(
        {
            name: follower // conditions
        }, {
            // name: data.user,
            $pull: {
                users_follow: following // update data
            }
        } );

    if ( !res ) {
        return { result: false };
    }
    return { result: true };
};

/**
 * Return user if it exist, or create new user and return
 * @param data Include user "name"
 * @returns {Promise<{user: *}|{error: *}>}
 */
const checkAndCreate = async function ( data ) { // check for existing user and create if not exist
    try {
        let user = await UserModel.find( { name: data.name } );
        if( user ) return { user };

        user = await UserModel.create( { name: data.name } );
        console.log( `User ${data.name} created!` );
        return { user };

    } catch ( error ) {
        return { error };
    }
};

const increaseWobjectWeight = async function ( data ) {
    try {
        await checkAndCreate( { name: data.name } ); // check for existing user in DB
        await UserWobjectsModel.findOneAndUpdate( // add weight in wobject to user, or create if it not exist
            {
                user_name: data.name,
                author_permlink: data.author_permlink
            },
            {
                $inc: {
                    weight: data.weight
                }
            }, {
                upsert: true,
                new: true,
                setDefaultsOnInsert: true
            } );
        await increaseUserWobjectsWeight( { name: data.name, weight: data.weight } );
        return { result: true };
    } catch ( error ) {
        return { error };
    }
};

const increaseUserWobjectsWeight = async function ( data ) {
    try {
        await UserModel.findOneAndUpdate( {
            name: data.name
        }, {
            $inc: {
                wobjects_weight: data.weight
            }
        }, {
            upsert: true,
            new: true,
            setDefaultsOnInsert: true
        } );
        return { result: true };
    } catch ( error ) {
        return { error };
    }
};

const checkForObjectShares = async function ( data ) { // object shares - user weight in specified wobject
    try {
        const userWobject = await UserWobjectsModel.findOne( {
            user_name: data.name,
            author_permlink: data.author_permlink
        } ).lean();

        if ( !userWobject ) {
            return { error: { message: 'User have no weight in current object!' } };
        }
        return { weight: userWobject.weight };

    } catch ( error ) {
        return { error };
    }
};

const update = async function ( condition, updateData ) {
    try{
        return { result: await UserModel.update( condition, updateData ) };
    } catch ( error ) {
        return { error };
    }
};

const updateOne = async function ( condition, updateData ) {
    try{
        return { result: await UserModel.updateOne( condition, updateData ) };
    } catch ( error ) {
        return { error };
    }
};

const increaseCountPosts = async ( author ) => {
    try{
        await UserModel.updateOne(
            { name: author },
            { $inc: { count_posts: 1, last_posts_count: 1 } }
        );
        return { result: true };
    } catch( error ) {
        return { error };
    }
};

module.exports = {
    create,
    addObjectFollow,
    removeObjectFollow,
    addUserFollow,
    removeUserFollow,
    checkAndCreate,
    increaseWobjectWeight,
    checkForObjectShares,
    update,
    updateOne,
    increaseCountPosts
};
