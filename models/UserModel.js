const UserModel = require( '../database' ).models.User;
const UserWobjectsModel = require( '../database' ).models.UserWobjects;
const _ = require( 'lodash' );

const create = async function ( data ) {
    const newUser = new UserModel( data );

    try {
        return { user: await newUser.save() };
    } catch ( error ) {
        return { error };
    }
};

const addObjectFollow = async function ( data ) { // create user(if it doesn't exist) and update info
    const check = await checkAndCreate( data.user );
    if ( check.error ) {
        return { error: check.error };
    }
    try{
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
    } catch ( error ) {
        return { error };
    }
};

const removeObjectFollow = async function ( data ) { // create user(if it doesn't exist) and update info
    try {
        const res = await UserModel.findOneAndUpdate(
            {
                name: data.user // conditions
            }, {
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
    } catch ( error ) {
        return { error };
    }
};

const addUserFollow = async function ( { follower, following } ) {
    if ( !_.isString( follower ) || !_.isString( following ) ) {
        return { error: 'follower and following must be a string!' };
    }
    try{
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
    } catch ( error ) {
        return { error };
    }
};

const removeUserFollow = async function ( { follower, following } ) {
    if ( !_.isString( follower ) || !_.isString( following ) ) {
        return { error: 'follower and following must be a string!' };
    }
    try{
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
    } catch ( error ) {
        return { error };
    }

};

/**
 * Return user if it exist, or create new user and return
 * @param data Include user "name"
 * @returns {Promise<{user: *}|{error: *}>}
 */
const checkAndCreate = async function ( name ) { // check for existing user and create if not exist
    if ( !_.isString( name ) ) {
        return { error: 'Name must be a string!' };
    }
    try {
        let user = await UserModel.findOne( { name: name } ).lean();
        if( user ) return { user };

        user = await UserModel.create( { name: name } );
        console.log( `User ${name} created!` );
        return { user };

    } catch ( error ) {
        return { error };
    }
};

const increaseWobjectWeight = async function ( data ) {
    try {
        await checkAndCreate( { name: data.name } ); // check for existing user in DB
        await UserWobjectsModel.updateOne( // add weight in wobject to user, or create if it not exist
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
        await UserModel.updateOne( {
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
        return { result: await UserModel.updateMany( condition, updateData ) };
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
        const result = await UserModel.updateOne(
            { name: author },
            { $inc: { count_posts: 1, last_posts_count: 1 } }
        );
        return { result: result.nModified === 1 };
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
