const { expect, votePostHelper, UserWobjects, User, WObject, ObjectType, faker, Post } = require( '../../../testHelper' );
const { BLACK_LIST_BOTS } = require( '../../../../utilities/constants' );
const votePostMocks = require( './mocks' );

describe( 'VoteParser', () => {
    describe( ' On Post helper voteOnPost', async () => {
        let mocks;
        let upd_author, upd_voter;

        describe( 'on valid input data', async () => {
            beforeEach( async () => {
                mocks = await votePostMocks();
                await votePostHelper.voteOnPost( { post: mocks.post, voter: mocks.user_voter.name, metadata: mocks.metadata, percent: 10000 } );
                upd_author = await User.findOne( { name: mocks.user_author.name } ).lean();
                upd_voter = await User.findOne( { name: mocks.user_voter.name } ).lean();
            } );

            for( const idx of [ 0, 1, 2, 3, 4 ] ) {
                describe( `For wobject ${idx + 1} `, async () => {
                    let wobject, user_wobj_author, user_wobj_voter, object_type;

                    beforeEach( async () => {
                        wobject = mocks.wobjects[ idx ];
                        user_wobj_author = await UserWobjects.findOne( { user_name: upd_author.name, author_permlink: wobject.author_permlink } ).lean();
                        user_wobj_voter = await UserWobjects.findOne( { user_name: upd_voter.name, author_permlink: wobject.author_permlink } ).lean();
                        object_type = mocks.object_types.find( ( t ) => t.name === wobject.object_type );
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

                        for( const wobj of mocks.wobjects ) {
                            sum += ( await UserWobjects.findOne( { user_name: upd_voter.name, author_permlink: wobj.author_permlink } ).lean() ).weight;
                        }
                        expect( upd_voter.wobjects_weight ).to.eq( sum );
                    } );

                    it( 'should create author wobjects_weight as a sum of all wobjects weights', async () => {
                        let sum = 0;

                        for( const wobj of mocks.wobjects ) {
                            sum += ( await UserWobjects.findOne( { user_name: upd_author.name, author_permlink: wobj.author_permlink } ).lean() ).weight;
                        }
                        expect( upd_author.wobjects_weight ).to.eq( sum );
                    } );

                    it( 'should correctly update wobject weight', async () => {
                        const upd_wobject = await WObject.findOne( { author_permlink: wobject.author_permlink } );
                        const weight_diff = upd_wobject.weight - wobject.weight;

                        expect( weight_diff ).to.eq( Number( ( Math.round( mocks.vote.rshares * 1e-6 ) / 5 ).toFixed( 3 ) ) );
                    } );

                    it( 'should correctly update ObjectTypes weights', async () => {
                        const upd_type = await ObjectType.findOne( { name: wobject.object_type } ).lean();
                        const weight_diff = upd_type.weight - object_type.weight;
                        const expected = Number( ( Math.round( mocks.vote.rshares * 1e-6 ) / 5 ).toFixed( 3 ) );

                        expect( weight_diff ).to.eq( expected );
                    } );
                    it( 'should add vote to active_votes', async () => {
                        const upd_post = await Post.findOne( { author: mocks.post.author, permlink: mocks.post.permlink } );
                        expect( upd_post.active_votes[ 0 ] ).to.exist;
                    } );
                } );
            }
            it( 'test', () => {} );
        } );
        
        describe( 'if voter from blackList', async () => {
            beforeEach( async () => {
                mocks = await votePostMocks( {
                    voter: BLACK_LIST_BOTS[ faker.random.number( BLACK_LIST_BOTS.length - 1 ) ]
                } );
                await votePostHelper.voteOnPost( {
                    post: mocks.post,
                    voter: mocks.user_voter.name,
                    metadata: mocks.metadata,
                    percent: 10000
                } );
                upd_author = await User.findOne( { name: mocks.user_author.name } ).lean();
                upd_voter = await User.findOne( { name: mocks.user_voter.name } ).lean();
            } );
            for( const idx of [ 0, 1, 2, 3, 4 ] ) {
                describe( `For wobject ${idx + 1} `, async () => {
                    let wobject, user_wobj_author, user_wobj_voter, object_type;

                    beforeEach( async () => {
                        wobject = mocks.wobjects[ idx ];
                        user_wobj_author = await UserWobjects.findOne( { user_name: upd_author.name, author_permlink: wobject.author_permlink } ).lean();
                        user_wobj_voter = await UserWobjects.findOne( { user_name: upd_voter.name, author_permlink: wobject.author_permlink } ).lean();
                        object_type = mocks.object_types.find( ( t ) => t.name === wobject.object_type );
                    } );

                    it( 'should not create user_wobject docs for author', async () => {
                        expect( user_wobj_author ).to.not.exist;
                    } );

                    it( 'should not create user_wobjects docs for voter', () => {
                        expect( user_wobj_voter ).to.not.exist;
                    } );

                    it( 'should not create voter wobjects_weight as a sum of all wobjects weights', async () => {
                        expect( upd_voter.wobjects_weight ).to.eq( 0 );
                    } );

                    it( 'should not create author wobjects_weight as a sum of all wobjects weights', async () => {
                        expect( upd_author.wobjects_weight ).to.eq( 0 );
                    } );

                    it( 'should not update wobject weight', async () => {
                        const upd_wobject = await WObject.findOne( { author_permlink: wobject.author_permlink } );
                        const weight_diff = upd_wobject.weight - wobject.weight;

                        expect( weight_diff ).to.eq( 0 );
                    } );

                    it( 'should not update ObjectTypes weights', async () => {
                        const upd_type = await ObjectType.findOne( { name: wobject.object_type } ).lean();
                        const weight_diff = upd_type.weight - object_type.weight;

                        expect( weight_diff ).to.eq( 0 );
                    } );

                    it( 'should add vote to active_votes', async () => {
                        const upd_post = await Post.findOne( { author: mocks.post.author, permlink: mocks.post.permlink } );
                        expect( upd_post.active_votes[ 0 ] ).to.exist;
                    } );
                } );
            }
            it( 'test', () => {} );
        } );

        describe( 'if author from blackList', async () => {
            beforeEach( async () => {
                mocks = await votePostMocks( {
                    author: BLACK_LIST_BOTS[ faker.random.number( BLACK_LIST_BOTS.length - 1 ) ]
                } );
                await votePostHelper.voteOnPost( {
                    post: mocks.post,
                    voter: mocks.user_voter.name,
                    metadata: mocks.metadata,
                    percent: 10000
                } );
                upd_author = await User.findOne( { name: mocks.user_author.name } ).lean();
                upd_voter = await User.findOne( { name: mocks.user_voter.name } ).lean();
            } );
            for( const idx of [ 0, 1, 2, 3, 4 ] ) {
                describe( `For wobject ${idx + 1} `, async () => {
                    let wobject, user_wobj_author, user_wobj_voter, object_type;

                    beforeEach( async () => {
                        wobject = mocks.wobjects[ idx ];
                        user_wobj_author = await UserWobjects.findOne( { user_name: upd_author.name, author_permlink: wobject.author_permlink } ).lean();
                        user_wobj_voter = await UserWobjects.findOne( { user_name: upd_voter.name, author_permlink: wobject.author_permlink } ).lean();
                        object_type = mocks.object_types.find( ( t ) => t.name === wobject.object_type );
                    } );

                    it( 'should not create user_wobject docs for author', async () => {
                        expect( user_wobj_author ).to.not.exist;
                    } );

                    it( 'should not create user_wobjects docs for voter', () => {
                        expect( user_wobj_voter ).to.not.exist;
                    } );

                    it( 'should not create voter wobjects_weight as a sum of all wobjects weights', async () => {
                        expect( upd_voter.wobjects_weight ).to.eq( 0 );
                    } );

                    it( 'should not create author wobjects_weight as a sum of all wobjects weights', async () => {
                        expect( upd_author.wobjects_weight ).to.eq( 0 );
                    } );

                    it( 'should not update wobject weight', async () => {
                        const upd_wobject = await WObject.findOne( { author_permlink: wobject.author_permlink } );
                        const weight_diff = upd_wobject.weight - wobject.weight;

                        expect( weight_diff ).to.eq( 0 );
                    } );

                    it( 'should not update ObjectTypes weights', async () => {
                        const upd_type = await ObjectType.findOne( { name: wobject.object_type } ).lean();
                        const weight_diff = upd_type.weight - object_type.weight;

                        expect( weight_diff ).to.eq( 0 );
                    } );

                    it( 'should add vote to active_votes', async () => {
                        const upd_post = await Post.findOne( { author: mocks.post.author, permlink: mocks.post.permlink } );
                        expect( upd_post.active_votes[ 0 ] ).to.exist;
                    } );
                } );
            }
            it( 'test', () => {} );
        } );

    } );

} );
