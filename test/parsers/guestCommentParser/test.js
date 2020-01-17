const { expect, guestCommentParser, postsUtil, faker, sinon, Comment, CommentModel } = require( '../../testHelper' );
const { CommentFactory, UserFactory } = require( '../../factories' );
const constants = require( '../../../utilities/constants' );
const _ = require( 'lodash' );

describe( 'guestCommentParser', async () => {
    let mockListBots;
    beforeEach( async () => {
        mockListBots = _.times( 5, faker.name.firstName );
        sinon.stub( constants, 'WAIVIO_PROXY_BOTS' ).value( mockListBots );
    } );
    afterEach( () => {
        sinon.restore();
    } );
    describe( 'on valid input data', async () => {
        let validOp, validMetadata, guestAuthor;
        beforeEach( async () => {
            guestAuthor = ( await UserFactory.Create( { name: `waivio_${faker.name.firstName().toLowerCase()}` } ) ).user;
            validMetadata = {
                community: 'test',
                app: 'test',
                comment: { userId: guestAuthor.name, social: 'test' }
            };
            const mockComment = await CommentFactory.Create( { author: mockListBots[ faker.random.number( 4 ) ], onlyData: true } );
            validOp = { ...mockComment, json_metadata: JSON.stringify( validMetadata ) };
            sinon.stub( postsUtil, 'getPost' ).callsFake( () => ( { post: mockComment } ) );
            sinon.spy( CommentModel, 'createOrUpdate' );
            await guestCommentParser.parse( { operation: validOp, metadata: validMetadata } );
        } );
        afterEach( () => {
            sinon.restore();
        } );
        it( 'should call postsUtil.getPost once', async () => {
            expect( postsUtil.getPost ).to.be.calledOnce;
        } );
        it( 'should call CommentModel.createOrUpdate once', () => {
            expect( CommentModel.createOrUpdate ).to.be.calledOnce;
        } );
        it( 'should create Comment in DB', async () => {
            const comment = await Comment.findOne( { author: validOp.author, permlink: validOp.permlink } );
            expect( comment ).is.exist;
        } );
        it( 'should create comment with correct guestInfo', async () => {
            const comment = await Comment.findOne( { author: validOp.author, permlink: validOp.permlink } );
            expect( comment.guestInfo ).to.be.deep.eq( { ...validMetadata.comment } );
        } );
    } );

    describe( 'on invalid input data', async () => {
        let validOp, validMetadata, guestAuthor;
        beforeEach( async () => {
            guestAuthor = ( await UserFactory.Create( { name: `waivio_${faker.name.firstName().toLowerCase()}` } ) ).user;
            validMetadata = {
                community: 'test',
                app: 'test',
                comment: { userId: guestAuthor.name, social: 'test' }
            };
            const mockComment = await CommentFactory.Create( { author: mockListBots[ faker.random.number( 4 ) ], onlyData: true } );
            validOp = { ...mockComment, json_metadata: JSON.stringify( validMetadata ) };
            sinon.stub( postsUtil, 'getPost' ).callsFake( () => ( { post: mockComment } ) );
            sinon.spy( CommentModel, 'createOrUpdate' );
            // await guestCommentParser.parse( { operation: validOp, metadata: validMetadata } );
        } );
        afterEach( () => {
            sinon.restore();
        } );

        describe( 'when proxy bot is incorrect', async () => {
            beforeEach( async () => {
                validOp.author = faker.name.firstName().toLowerCase();
                await guestCommentParser.parse( { operation: validOp, metadata: validMetadata } );
            } );
            it( 'should not call postsUtil.getPost ', async () => {
                expect( postsUtil.getPost ).to.not.be.called;
            } );
            it( 'should not create Comment in DB', async () => {
                const comment = await Comment.findOne( { author: validOp.author, permlink: validOp.permlink } );
                expect( comment ).is.not.exist;
            } );
        } );

        describe( 'when guestInfo in metadata is incorrect', async () => {
            beforeEach( async () => {
                delete validMetadata.comment.userId;
                await guestCommentParser.parse( { operation: validOp, metadata: validMetadata } );
            } );
            it( 'should not call postsUtil.getPost ', async () => {
                expect( postsUtil.getPost ).to.not.be.called;
            } );
            it( 'should not create Comment in DB', async () => {
                const comment = await Comment.findOne( { author: validOp.author, permlink: validOp.permlink } );
                expect( comment ).is.not.exist;
            } );
        } );

        describe( 'when comment already not exist in blockchain', async () => {
            beforeEach( async () => {
                postsUtil.getPost.restore();
                sinon.stub( postsUtil, 'getPost' ).callsFake( () => ( { err: 'Comment not found!' } ) );
                await guestCommentParser.parse( { operation: validOp, metadata: validMetadata } );
            } );
            it( 'should call postsUtil.getPost once', async () => {
                expect( postsUtil.getPost ).to.be.called;
            } );
            it( 'should not create Comment in DB', async () => {
                const comment = await Comment.findOne( { author: validOp.author, permlink: validOp.permlink } );
                expect( comment ).is.not.exist;
            } );
        } );
    } );
} );

