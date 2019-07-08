const { expect, sinon, voteFieldHelper, postsUtil, voteParser, UserWobjects, redisGetter, User } = require( '../../testHelper' );
const { voteAppendObjectMocks } = require( './mocks' );

describe( 'VoteParser', async () => {
    describe( 'on voteAppendObject', async () => {
        describe( 'when voter have no weight in wobject', async () => {
            let voteFieldHelperStub;
            let postUtilStub;
            let mocks;

            before( async () => {
                mocks = await voteAppendObjectMocks();
                voteFieldHelperStub = sinon.stub( voteFieldHelper, 'voteOnField' ).callsFake( async () => {
                } );
                postUtilStub = sinon.stub( postsUtil, 'getPost' ).callsFake( async () => {
                    return [ mocks.post ];
                } );
                await voteParser.parse( [ mocks.vote ] );
            } );

            after( () => {
                voteFieldHelperStub.restore();
                postUtilStub.restore();
            } );

            it( 'should call "voteField" once', async () => {
                expect( voteFieldHelperStub.calledOnce ).to.be.true;
            } );

            it( 'should call "getPost" once', async () => {
                expect( postUtilStub.calledOnce ).to.be.true;
            } );

            it( 'should call "voteField" with params', async () => {
                const resp = await redisGetter.getHashAll( `${mocks.vote.author}_${mocks.vote.permlink}` );
                const data = {
                    author: mocks.post.author,
                    permlink: mocks.post.permlink,
                    author_permlink: resp.root_wobj,
                    percent: mocks.vote.weight,
                    voter: mocks.vote.voter,
                    weight: 1
                };

                expect( voteFieldHelperStub.args[ 0 ][ 0 ] ).to.deep.equal( data );
            } );
        } );

        describe( 'when voter have weight in wobject', async () => {
            let voteFieldHelperStub;
            let postUtilStub;
            let mocks;
            let redisResp;

            before( async () => {
                mocks = await voteAppendObjectMocks();
                redisResp = await redisGetter.getHashAll( `${mocks.vote.author}_${mocks.vote.permlink}` );
                await UserWobjects.create( {
                    user_name: mocks.vote.voter,
                    author_permlink: redisResp.root_wobj,
                    weight: 9999
                } );
                voteFieldHelperStub = sinon.stub( voteFieldHelper, 'voteOnField' ).callsFake( async () => {} );
                postUtilStub = sinon.stub( postsUtil, 'getPost' ).callsFake( async () => {
                    return [ mocks.post ];
                } );
                await voteParser.parse( [ mocks.vote ] );
            } );

            after( () => {
                voteFieldHelperStub.restore();
                postUtilStub.restore();
            } );

            it( 'should call "voteField" once', async () => {
                expect( voteFieldHelperStub.calledOnce ).to.be.true;
            } );

            it( 'should call "getPost" once', async () => {
                expect( postUtilStub.calledOnce ).to.be.true;
            } );

            it( 'should call "voteField" with params', async () => {
                const data = {
                    author: mocks.post.author,
                    permlink: mocks.post.permlink,
                    author_permlink: redisResp.root_wobj,
                    percent: mocks.vote.weight,
                    voter: mocks.vote.voter,
                    weight: 9999
                };

                expect( voteFieldHelperStub.args[ 0 ][ 0 ] ).to.deep.equal( data );
            } );
        } );
    } );
} );
