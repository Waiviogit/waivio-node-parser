const { PostModel, expect, sinon } = require( '../../testHelper' );
const { PostFactory } = require( '../../factories' );


describe( 'On updatePostAfterComment', async () => {
    describe( 'On updateCounters', async () => {
        let post, updatedPost;
        beforeEach( async () => {
            post = await PostFactory.Create();
            updatedPost = await PostFactory.Create( { children: 10, author: post.author, onlyData: true, permlink: post.permlink } );
        } );
        afterEach( async () => {
            sinon.restore();
        } );
        it( 'should update post with correct data', async () => {

        } );
    } );
} );
