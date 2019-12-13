const { expect, sinon, faker, followObjectParser, userParsers, User, Post, votePostHelper } = require( '../../testHelper' );
const { guestVote } = require( '../../../utilities/guestOperations/customJsonOperations' );
const { UserFactory, ObjectFactory, PostFactory } = require( '../../factories' );
const constants = require( '../../../utilities/constants' );
const _ = require( 'lodash' );

describe( 'customJsonOperations', async () => {
    let mockListBots;
    beforeEach( async () => {
        mockListBots = _.times( 5, faker.name.firstName );
        sinon.stub( constants, 'WAIVIO_PROXY_BOTS' ).value( mockListBots );
    } );
    afterEach( () => {
        sinon.restore();
    } );

    describe( 'on guestVote', async () => {
        let validJson, voter, post, wobjects;
        beforeEach( async () => {
            wobjects = await Promise.all( _.times( 2, ObjectFactory.Create ) );
            voter = ( await UserFactory.Create() ).user;
            post = await PostFactory.Create( {
                additionsForMetadata: {
                    wobj: {
                        wobjects: [
                            ...wobjects.map( ( w ) => ( { author_permlink: w.author_permlink, percent: 100 / wobjects.length } ) )
                        ]
                    }
                }
            } );
            validJson = {
                required_posting_auths: [ mockListBots[ 0 ] ],
                json: JSON.stringify( {
                    voter: voter.name,
                    author: post.author,
                    permlink: post.permlink,
                    weight: faker.random.number( { min: -10000, max: 10000 } )
                } )
            };
        } );
        describe( 'on valid input json', async () => {
            beforeEach( async () => {
                sinon.spy( votePostHelper, 'voteOnPost' );
                await guestVote( validJson );
            } );
            afterEach( () => {
                votePostHelper.voteOnPost.restore();
            } );
            it( 'should call votePostHelper once', async () => {
                expect( votePostHelper.voteOnPost ).to.be.calledOnce;
            } );
            it( 'should add new vote to Post in db', async () => {
                const upd_post = await Post.findOne( { author: post.author, permlink: post.permlink } );
                expect( upd_post.active_votes.map( ( v ) => v.voter ) ).to.include( voter.name );
            } );
            it( 'should add vote post with ZERO weight', async () => {
                const upd_post = await Post.findOne( { author: post.author, permlink: post.permlink } );
                const vote = upd_post.active_votes.find( ( v ) => v.voter === voter.name );
                expect( vote.weight ).to.be.eq( 0 );
            } );
        } );

    } );


} );
