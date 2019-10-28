const { expect, PostModel, Post } = require( '../../testHelper' );
const { PostFactory } = require( '../../factories' );

describe( 'PostModel', async () => {
    describe( 'On getPostsRefs', async () => {
        let postModel, postModel2;
        before( async () => {
            postModel = await PostFactory.Create();
            postModel2 = await PostFactory.Create();
        } );
        it( 'should get length of posts 2', async () => {
            let postsRefs = await PostModel.getPostsRefs() ;

            expect( postsRefs.posts.length ).to.deep.eq( 2 );
        } );
        it( 'should eq posts authors', async () => {
            let firstResult = postModel.author;
            let secondResult = postModel2.author;
            let postsRefs = await PostModel.getPostsRefs() ;

            expect( firstResult, secondResult ).to.deep.eq( postsRefs.posts[ 0 ].author, postsRefs.posts[ 1 ].author );
        } );
    } );
    describe( 'On Create', async () => {
        let data;
        beforeEach( async () => {
            data = await PostFactory.Create( { onlyData: true } );
        } );
        it( 'should success post parent_author is eq', async () => {
            const post = await PostModel.create( data );
            let postAuthor = post.post._doc.author;

            expect( postAuthor ).to.deep.eq( data.author );
        } );
        it( 'should success user created', async () => {
            const result = await PostModel.create( data );
            let user = result.post._doc.author;

            expect( user ).to.deep.eq( data.author );
        } );
        it( 'should success post create', async () => {
            const post = await PostModel.create( data );
            let res = post.post._doc.title;

            expect( res ).to.deep.eq( data.title );
        } );
    } );
    describe( 'On findOne', async () => {
        let post;
        before( async () => {
            post = await PostFactory.Create();
        } );
        it( 'should success findOne post exist', async () => {
            const foundedPost = await PostModel.findOne( { author: post.author, permlink: post.permlink } );

            expect( foundedPost.post ).to.exist;
        } );
        it( 'should success findOne post is null', async () => {
            const foundedPost = await PostModel.findOne( { author: 'some author', permlink: 'some permlink' } );

            expect( foundedPost.post ).is.null;
        } );
        it( 'should success findOne post author, permlink, title is eq ', async () => {
            const foundedPost = await PostModel.findOne( { author: post.author, permlink: post.permlink } );
            const expectedValues = ( ( { author, permlink, title } ) => ( { author, permlink, title } ) )( foundedPost.post );
            const actualValues = ( ( { author, permlink, title } ) => ( { author, permlink, title } ) )( post );
            expect( expectedValues ).to.deep.eq( actualValues );
        } );
        it( 'should error expected', async () => {
            const result = await PostModel.findOne();

            expect( result.error.message ).to.deep.eq( 'Cannot read property \'author\' of undefined' );
        } );
    } );
    describe( ' On update', async () => {
        let post, data, upd_post, result_update;
        before( async () => {
            post = await PostFactory.Create();
            data = {
                author: post.author,
                permlink: post.permlink,
                total_vote_weight: 10,
                net_votes: 50
            };
            result_update = await PostModel.update( data );
            upd_post = await Post.findOne( { author: post.author, permlink: post.permlink } );
        } );
        it( 'should success result update', async () => {
            expect( result_update ).is.exist;
        } );
        it( 'should equal  ', async () => {
            expect( { net_votes: upd_post._doc.net_votes, total_vote_weight: upd_post.total_vote_weight
            } ).to.not.deep.eq( { net_votes: post.net_votes, total_vote_weight: post.total_vote_weight } );
        } );
        it( 'should return error', async () => {
            let postModel2 = await PostModel.update();

            expect( 'Cannot read property \'author\' of undefined' ).to.deep.eq( postModel2.error.message );
        } );
        it( 'should eq data properties and upd_post properties after update', async () => {
            expect( data ).to.deep.eq( {
                author: upd_post.author,
                permlink: upd_post.permlink,
                total_vote_weight: upd_post.total_vote_weight,
                net_votes: upd_post.net_votes } );
        } );
        it( 'should eq author and permlink of post and upd_post', async () => {
            expect( { author: post.author, permlink: post.permlink } ).to.deep.eq( { author: upd_post.author,
                permlink: upd_post.permlink } );
        } );
    } );
} );

