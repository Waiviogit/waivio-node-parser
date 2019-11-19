const { expect, PostModel, Post, Mongoose, getRandomString } = require( '../../testHelper' );
const { PostFactory } = require( '../../factories' );
const _ = require( 'lodash' );

describe( 'PostModel', async () => {
    describe( 'On getPostsRefs', async () => {
        let firstPostModel, secondPostModel;
        beforeEach( async () => {
            await Mongoose.connection.dropDatabase( );
            firstPostModel = await PostFactory.Create();
            secondPostModel = await PostFactory.Create();
        } );
        it( 'should get correct length of posts', async () => {
            let postsRefs = await PostModel.getPostsRefs() ;

            expect( postsRefs.posts.length ).to.deep.eq( 2 );
        } );
        it( 'should check the identity authors of the posts', async () => {
            let firstResult = firstPostModel.author;
            let secondResult = secondPostModel.author;
            let postsRefs = await PostModel.getPostsRefs() ;

            expect( firstResult, secondResult ).to.deep.eq( postsRefs.posts[ 0 ].author, postsRefs.posts[ 1 ].author );
        } );
    } );
    describe( 'On Create', async () => {
        let data;
        beforeEach( async () => {
            data = await PostFactory.Create( { onlyData: true } );
        } );
        it( 'should get correct post author ', async () => {
            const post = await PostModel.create( data );
            const postAuthor = post.post._doc.author;
            expect( postAuthor ).to.eq( data.author );
        } );
        it( 'should user created successfully', async () => {
            await PostModel.create( data );
            const user = await Post.findOne( { permlink: data.permlink } );
            expect( user.author ).to.eq( data.author );
        } );
        it( 'should get error with incorrect params', async () => {
            const result = await PostModel.create( { some: { date: { to: 'test' } } } );
            expect( result.error ).is.exist;
        } );
        it( 'should get error with duplicate post by author+permlink', async () => {
            await PostModel.create( data );
            const result = await PostModel.create( data );
            expect( result.error ).exist;
        } );
    } );
    describe( 'On findOne', async () => {
        let post;
        before( async () => {
            post = await PostFactory.Create();
        } );
        it( 'should findOne post', async () => {
            const foundedPost = await PostModel.findOne( { author: post.author, permlink: post.permlink } );

            expect( foundedPost.post ).to.exist;
        } );
        it( 'should not find not exist post', async () => {
            const result = await PostModel.findOne( { author: getRandomString(), permlink: getRandomString() } );
            expect( result.post ).not.exist;
        } );
        it( 'should compare found post with created post', async () => {
            const foundedPost = await PostModel.findOne( { author: post.author, permlink: post.permlink } );
            const expectedValues = _.pick( foundedPost.post, [ 'author', 'permlink', 'title' ] );
            const actualValues = _.pick( post, [ 'author', 'permlink', 'title' ] );
            expect( expectedValues ).to.deep.eq( actualValues );
        } );
        it( 'should get error', async () => {
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
        it( 'should result update successfully', async () => {
            expect( result_update ).is.exist;
        } );
        it( 'should compare fields so they are the same ', async () => {
            expect( { net_votes: upd_post._doc.net_votes, total_vote_weight: upd_post.total_vote_weight
            } ).to.not.eq( { net_votes: post.net_votes, total_vote_weight: post.total_vote_weight } );
        } );
        it( 'should return error', async () => {
            let postModel = await PostModel.update();

            expect( 'Cannot read property \'author\' of undefined' ).to.deep.eq( postModel.error.message );
        } );
        it( 'should compare data properties and upd_post properties after update', async () => {
            expect( data ).to.deep.eq( {
                author: upd_post.author,
                permlink: upd_post.permlink,
                total_vote_weight: upd_post.total_vote_weight,
                net_votes: upd_post.net_votes } );
        } );
    } );
} );

