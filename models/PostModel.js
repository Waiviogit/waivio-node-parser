const PostModel = require( '../database' ).models.Post;
const User = require( './UserModel' );
const _ = require( 'lodash' );

const create = async function ( data ) {
    await User.checkAndCreate( data.author ); // create user in DB if it doesn't exist

    const newPost = new PostModel( data );

    try {
        return { post: await newPost.save() };
    } catch ( error ) {
        return { error };
    }
};

const findOne = async function ( data ) {
    try {
        const cond = _.pick( data, [ data.root_author ? 'root_author' : 'author', 'permlink' ] );
        const post = await PostModel.findOne( { ...cond } ).lean();
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
