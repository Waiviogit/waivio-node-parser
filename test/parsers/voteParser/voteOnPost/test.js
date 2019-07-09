const { expect, votePostHelper, UserWobjects, User, WObject } = require( '../../../testHelper' );
const votePostMocks = require( './mocks' );

describe( 'Vote On Post helper', async () => {
    let mocks;
    let upd_author, upd_voter;

    before( async () => {
        mocks = await votePostMocks();
        await votePostHelper.voteOnPost( { post: mocks.post, voter: mocks.user_voter.name, metadata: mocks.metadata, percent: 10000 } );
        upd_author = await User.findOne( { name: mocks.user_author.name } ).lean();
        upd_voter = await User.findOne( { name: mocks.user_voter.name } ).lean();
    } );

    it( 'should create user_wobjects docs for author', async () => {
        for( const wobject of mocks.wobjects ) {
            const user_wobj_author = await UserWobjects.findOne( { user_name: upd_author.name, author_permlink: wobject.author_permlink } ).lean();

            expect( user_wobj_author ).to.exist;
        }
    } );
    it( 'should create user_wobjects docs for author with correct weight', async () => {
        for( const wobject of mocks.wobjects ) {
            const user_wobj_author = await UserWobjects.findOne( { user_name: upd_author.name, author_permlink: wobject.author_permlink } ).lean();

            expect( user_wobj_author.weight ).to.eq( Math.round( mocks.vote.rshares * 1e-6 ) * 0.5 * 0.75 );
        }
    } );
    it( 'should create user_wobjects docs for voter', async () => {
        for( const wobject of mocks.wobjects ) {
            const user_wobj_voter = await UserWobjects.findOne( { user_name: upd_voter.name, author_permlink: wobject.author_permlink } ).lean();

            expect( user_wobj_voter ).to.exist;
        }
    } );
    it( 'should create user_wobjects docs for voter with correct weight', async () => {
        for( const wobject of mocks.wobjects ) {
            const user_wobj_voter = await UserWobjects.findOne( { user_name: upd_voter.name, author_permlink: wobject.author_permlink } ).lean();

            expect( user_wobj_voter.weight ).to.eq( Math.round( mocks.vote.rshares * 1e-6 ) * 0.5 * 0.25 );
        }
    } );
    it( 'should create voter wobjects_weight as a sum of all wobjects weights', async () => {
        let sum = 0;

        for( const wobject of mocks.wobjects ) {
            const user_wobj_voter = await UserWobjects.findOne( { user_name: upd_voter.name, author_permlink: wobject.author_permlink } ).lean();

            sum += user_wobj_voter.weight;
        }
        expect( upd_voter.wobjects_weight ).to.eq( sum );
    } );
    it( 'should create author wobjects_weight as a sum of all wobjects weights', async () => {
        let sum = 0;

        for( const wobject of mocks.wobjects ) {
            const user_wobj_author = await UserWobjects.findOne( { user_name: upd_author.name, author_permlink: wobject.author_permlink } ).lean();

            sum += user_wobj_author.weight;
        }
        expect( upd_author.wobjects_weight ).to.eq( sum );
    } );
    it( 'should correctly update all wobjects weights', async () => {
        for( const wobject of mocks.wobjects ) {
            const upd_wobject = await WObject.findOne( { author_permlink: wobject.author_permlink } );
            const weight_diff = upd_wobject.weight - wobject.weight;

            expect( weight_diff ).to.eq( Math.round( mocks.vote.rshares * 1e-6 ) * 0.5 );
        }
    } );

} );
