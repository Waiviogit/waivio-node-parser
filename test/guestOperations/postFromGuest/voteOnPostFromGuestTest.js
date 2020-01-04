const { expect, sinon, faker, Post, votePostHelper, UserWobjects, User, WObject, ObjectType } = require( '../../testHelper' );
const constants = require( '../../../utilities/constants' );
const mocksForVotePost = require( './mocksForVotePost' );
const _ = require( 'lodash' );

describe( 'On votePostHelper', async () => {
    let mockListBots;
    beforeEach( async () => {
        mockListBots = _.times( 5, faker.name.firstName );
        sinon.stub( constants, 'WAIVIO_PROXY_BOTS' ).value( mockListBots );
    } );
    afterEach( () => {
        sinon.restore();
    } );
    describe( 'when vote on post written by guest user', async () => {
        let mocks, upd_post, upd_voter, upd_author;
        beforeEach( async () => {
            mocks = await mocksForVotePost( { proxyBot: mockListBots[ 0 ] } );
        } );
        describe( 'on valid input', async () => {
            beforeEach( async () => {
                await votePostHelper.voteOnPost( {
                    post: mocks.post,
                    voter: mocks.user_voter.name,
                    metadata: mocks.metadata,
                    percent: 10000
                } );
                upd_post = await Post.findOne( { author: mocks.post.author, permlink: mocks.post.permlink } );
                upd_voter = await User.findOne( { name: mocks.user_voter.name } );
                upd_author = await User.findOne( { name: mocks.guest_author.name } );
            } );
            it( 'should add vote to post', async () => {
                const vote = upd_post.active_votes.find( ( v ) => v.voter === mocks.user_voter.name );
                expect( vote ).to.exist;
            } );
            for ( const idx of [ 0, 1, 2, 3, 4 ] ) {
                describe( `For wobject ${idx + 1} `, async () => {
                    let wobject, user_wobj_author, user_wobj_voter, object_type, upd_type, upd_wobject;

                    beforeEach( async () => {
                        wobject = mocks.wobjects[ idx ];
                        user_wobj_author = await UserWobjects.findOne( {
                            user_name: upd_author.name,
                            author_permlink: wobject.author_permlink
                        } ).lean();
                        user_wobj_voter = await UserWobjects.findOne( {
                            user_name: upd_voter.name,
                            author_permlink: wobject.author_permlink
                        } ).lean();
                        object_type = mocks.object_types.find( ( t ) => t.name === wobject.object_type );
                        upd_type = await ObjectType.findOne( { name: wobject.object_type } ).lean();
                        upd_wobject = await WObject.findOne( { author_permlink: wobject.author_permlink } );
                    } );

                    it( 'should create user_wobject docs for author', async () => {
                        expect( user_wobj_author ).to.exist;
                    } );

                    it( 'should create user_wobjects docs for author with correct weight', async () => {
                        expect( user_wobj_author.weight ).to.eq( Number( ( Math.round( mocks.vote.rshares * 1e-6 ) * 0.2 * 0.75 ).toFixed( 3 ) ) ); // 0.2 because 5 wobjects on post
                    } );

                    it( 'should create user_wobjects docs for voter', () => {
                        expect( user_wobj_voter ).to.exist;
                    } );

                    it( 'should create user_wobjects docs for voter with correct weight', () => {
                        expect( user_wobj_voter.weight ).to.eq( Number( ( Math.round( mocks.vote.rshares * 1e-6 ) * 0.2 * 0.25 ).toFixed( 3 ) ) );
                    } );

                    it( 'should create voter wobjects_weight as a sum of all wobjects weights', async () => {
                        let sum = 0;
                        for ( const wobj of mocks.wobjects ) {
                            sum += ( await UserWobjects.findOne( {
                                user_name: upd_voter.name,
                                author_permlink: wobj.author_permlink
                            } ).lean() ).weight;
                        }
                        expect( upd_voter.wobjects_weight ).to.eq( sum );
                    } );

                    it( 'should create author wobjects_weight as a sum of all wobjects weights', async () => {
                        let sum = 0;
                        for ( const wobj of mocks.wobjects ) {
                            sum += ( await UserWobjects.findOne( {
                                user_name: upd_author.name,
                                author_permlink: wobj.author_permlink
                            } ).lean() ).weight;
                        }
                        expect( upd_author.wobjects_weight ).to.eq( sum );
                    } );

                    it( 'should correctly update wobject weight', async () => {
                        const weight_diff = upd_wobject.weight - wobject.weight;
                        expect( weight_diff ).to.eq( Number( ( Math.round( mocks.vote.rshares * 1e-6 ) / 5 ).toFixed( 3 ) ) );
                    } );

                    it( 'should correctly update ObjectTypes weights', async () => {
                        const weight_diff = upd_type.weight - object_type.weight;
                        const expected = Number( ( Math.round( mocks.vote.rshares * 1e-6 ) / 5 ).toFixed( 3 ) );

                        expect( weight_diff ).to.eq( expected );
                    } );
                } );
            }
        } );
    } );
} );
