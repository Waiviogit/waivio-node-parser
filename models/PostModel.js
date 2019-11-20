const PostModel = require( '../database' ).models.Post;
const User = require( './UserModel' );

const create = async function ( data ) {
    User.checkAndCreate( { name: data.author } ); // create user in DB if it doesn't exist

    const newPost = new PostModel( data );

    try {
        return { post: await newPost.save() };
    } catch ( error ) {
        return { error };
    }
};

const findOne = async function ( { author, permlink, reblog_by = null } ) {
    try {
        const post = await PostModel.findOne( { author, permlink, reblog_by } ).lean();
        return { post };
    } catch ( error ) {
        return { error };
    }
};

const update = async function ( data ) {
    try {
        const result = await PostModel.findOneAndUpdate(
            {
                author: data.author,
                permlink: data.permlink
            },
            data,
            {
                upsert: true,
                new: true,
                setDefaultsOnInsert: true
            }
        );

        return { result };
    } catch ( error ) {
        return { error };
    }
};

const getPostsRefs = async function() {
    try{
        return {
            posts: await PostModel.aggregate( [ {
                $project: {
                    _id: 0,
                    author: 1,
                    permlink: 1,
                    wobjects: 1
                }
            } ] )
        };
    } catch ( error ) {
        return{ error };
    }
};

module.exports = { create, update, findOne, getPostsRefs };
