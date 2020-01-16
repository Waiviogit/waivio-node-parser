const { expect, faker, CommentModel, Comment, User } = require( '../../testHelper' );
const { CommentFactory } = require( '../../factories' );
const _ = require( 'lodash' );

describe( 'CommentModel', async () => {
    describe( 'On create', () => {
        let comment, result, createdComment;

        beforeEach( async () => {
            comment = await CommentFactory.Create( { onlyData: true } );
            result = await CommentModel.createOrUpdate( comment );
            createdComment = await Comment.findOne( { author: comment.author, permlink: comment.permlink } ).lean();
        } );
        it( 'should create user - author of comment ', async () => {
            const user = await User.findOne( { name: comment.author } ).lean();
            expect( user ).is.exist;
        } );

        it( 'should create comment in DB', async () => {
            expect( createdComment ).is.exist;
        } );
        it( 'should create comment with correct fields', async () => {
            const keys = 'author,permlink,parent_author,parent_permlink,root_author,root_permlink,active_votes,guestInfo,_id'.split( ',' );
            expect( createdComment ).to.has.all.keys( keys );
        } );
        it( 'should create comment with correct fields values', () => {
            expect( _.omit( createdComment, '_id' ) ).to.deep.eq( comment );
        } );
        it( 'should return comment:null if comment didn\'t exist before ', () => {
            expect( result.comment ).to.be.null;
        } );
        it( 'should create comment only with allowed fields(without redundant)', async () => {
            comment = await CommentFactory.Create( { onlyData: true } );
            comment = { ...comment, redundantField1: faker.random.string(), redundantField2: faker.random.string() };
            result = await CommentModel.createOrUpdate( comment );
            createdComment = await Comment.findOne( { author: comment.author, permlink: comment.permlink } ).lean();
            expect( createdComment ).to.has.not.all.keys( [ 'redundantField1', 'redundantField2' ] );
        } );
        it( 'should update if comment was exist)', async () => {
            comment = await CommentFactory.Create();
            comment = { ...comment, active_votes: [ {
                voter: faker.name.firstName().toLowerCase(),
                weight: faker.random.number( 10000 ),
                percent: faker.random.number( 10000 )
            } ] };
            result = await CommentModel.createOrUpdate( comment );
            createdComment = await Comment.findOne( { author: comment.author, permlink: comment.permlink } ).lean();
            expect( createdComment.active_votes.map( ( v ) => _.omit( v, '_id' ) ) )
                .to.be.deep.eq( comment.active_votes );
        } );
    } );
} );

