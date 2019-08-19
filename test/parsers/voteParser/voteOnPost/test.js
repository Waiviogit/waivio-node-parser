const { expect, votePostHelper, UserWobjects, User, WObject, ObjectType } = require( '../../../testHelper' );
const votePostMocks = require( './mocks' );

describe( 'VoteParser', () => {
    describe( ' On Post helper', async () => {
        let mocks;
        let upd_author, upd_voter;

        before( async () => {
            mocks = await votePostMocks();
            await votePostHelper.voteOnPost( { post: mocks.post, voter: mocks.user_voter.name, metadata: mocks.metadata, percent: 10000 } );
            upd_author = await User.findOne( { name: mocks.user_author.name } ).lean();
            upd_voter = await User.findOne( { name: mocks.user_voter.name } ).lean();
        } );

        [ 0, 1, 2, 3, 4 ].forEach( ( idx ) => {
            describe( `For wobject ${idx + 1} `, async () => {
                let wobject, user_wobj_author, user_wobj_voter, object_type;

                before( async () => {
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
                        const voter = await UserWobjects.findOne( { user_name: upd_voter.name, author_permlink: wobj.author_permlink } ).lean();

                        sum += voter.weight;
                    }
                    expect( upd_voter.wobjects_weight ).to.eq( sum );
                } );

                it( 'should create author wobjects_weight as a sum of all wobjects weights', async () => {
                    let sum = 0;

                    for( const wobj of mocks.wobjects ) {
                        const author = await UserWobjects.findOne( { user_name: upd_author.name, author_permlink: wobj.author_permlink } ).lean();

                        sum += author.weight;
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

                    expect( weight_diff ).to.eq( Number( ( Math.round( mocks.vote.rshares * 1e-6 ) / 5 ).toFixed( 3 ) ) );
                } );
            } );
        } );
        it( 'test', () => {} );
    } );
} );
