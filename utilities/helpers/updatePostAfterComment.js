const _ = require( 'lodash' );
const { Post } = require( '../../models' );
const { postsUtil } = require( '../steemApi' );

const updateCounters = async( author, permlink ) => {

    const { post, err } = await postsUtil.getPost( author, permlink );
    if ( err ) {
        console.error( err.message );
        return;
    }
    if( post ) {
        const updData = _.omit( post,
            [ 'id', 'active_votes', 'wobjects', 'language', 'reblogged_by', 'author_weight' ] );
        await Post.update( updData );
    }

};

module.exports = { updateCounters };
