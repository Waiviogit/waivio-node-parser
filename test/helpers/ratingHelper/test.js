const { expect, WObject, ratingHelper, getRandomString, WobjModel, sinon } = require( '../../testHelper' );
const { AppendObject, UserFactory } = require( '../../factories' );

describe( 'ratingHelper', async () => {
    describe( 'on parse operation custom json with rating vote', async () => {
        describe( 'on valid operation data', async () => {
            let mockOp, wobject, field, voter, updField;
            beforeEach( async () => {
                voter = ( await UserFactory.Create() ).user;
                const append = await AppendObject.Create( { name: 'rating', body: getRandomString( 10 ) } );
                wobject = append.wobject;
                field = append.appendObject;
                mockOp = {
                    json: JSON.stringify( {
                        author: field.author,
                        permlink: field.permlink,
                        author_permlink: wobject.author_permlink,
                        rate: 10
                    } ),
                    required_posting_auths: [ voter.name ]
                };
                sinon.spy( WobjModel, 'getField' );
                sinon.spy( WobjModel, 'updateField' );
                await ratingHelper.parse( mockOp );
                updField = ( await WObject.findOne( wobject._id ).lean() ).fields[ 0 ];
            } );
            afterEach( () => {
                WobjModel.getField.restore();
                WobjModel.updateField.restore();
            } );
            it( 'should add field rating_votes to "rating" field', () => {
                expect( updField ).to.include.key( 'rating_votes' );
            } );
            it( 'should add field "average_rating_weight" to "rating" field', () => {
                expect( updField ).to.include.key( 'average_rating_weight' );
            } );
            it( 'should add correct averate rating weight', () => {
                expect( updField.average_rating_weight ).to.eq( 10 );
            } );
            it( 'should add non empty array rating_votes to "rating" field', () => {
                expect( updField.rating_votes ).to.not.be.empty;
            } );
            it( 'should call "getField" on wobject model once', () => {
                expect( WobjModel.getField ).to.be.calledOnce;
            } );
            it( 'should call "updateField" on wobject model once', () => {
                expect( WobjModel.updateField ).to.be.calledTwice;
            } );
        } );
        describe( 'on adding second vote to rating field', async () => {
            let mockOp, wobject, field, voter, updField;
            beforeEach( async () => {
                voter = ( await UserFactory.Create() ).user;
                const { appendObject, wobject: wobj } = await AppendObject.Create(
                    {
                        name: 'rating',
                        body: getRandomString( 10 ),
                        additionalFields: { rating_votes: [ { voter: getRandomString( 15 ), rate: 8 } ], average_rating_weight: 8 }
                    }
                );
                wobject = wobj;
                field = appendObject;
                mockOp = {
                    json: JSON.stringify( {
                        author: field.author,
                        permlink: field.permlink,
                        author_permlink: wobject.author_permlink,
                        rate: 10
                    } ),
                    required_posting_auths: [ voter.name ]
                };
                sinon.spy( WobjModel, 'getField' );
                sinon.spy( WobjModel, 'updateField' );
                await ratingHelper.parse( mockOp );
                updField = ( await WObject.findOne( wobject._id ).lean() ).fields[ 0 ];
            } );
            afterEach( () => {
                WobjModel.getField.restore();
                WobjModel.updateField.restore();
            } );
            it( 'should call "getField" on wobject model once', () => {
                expect( WobjModel.getField ).to.be.calledOnce;
            } );
            it( 'should call "updateField" on wobject model once', () => {
                expect( WobjModel.updateField ).to.be.calledTwice;
            } );
            it( 'should add new rating vote to "rating_votes"', () => {
                expect( updField.rating_votes.length ).to.eq( 2 );
            } );
            it( 'should correct change average raging weight value', () => {
                expect( updField.average_rating_weight ).to.eq( 9 );
            } );
        } );
        describe( 'on update existing rating vote', async () => {
            let mockOp, wobject, field, voter, updField;
            beforeEach( async () => {
                voter = ( await UserFactory.Create() ).user;
                const append = await AppendObject.Create( {
                    name: 'rating',
                    body: getRandomString( 10 ),
                    additionalFields: { rating_votes: [ { voter: voter.name, rate: 2 } ] }
                } );
                wobject = append.wobject;
                field = append.appendObject;
                mockOp = {
                    json: JSON.stringify( {
                        author: field.author,
                        permlink: field.permlink,
                        author_permlink: wobject.author_permlink,
                        rate: 10
                    } ),
                    required_posting_auths: [ voter.name ]
                };
                sinon.spy( WobjModel, 'getField' );
                sinon.spy( WobjModel, 'updateField' );
                await ratingHelper.parse( mockOp );
                updField = ( await WObject.findOne( wobject._id ).lean() ).fields[ 0 ];
            } );
            afterEach( () => {
                WobjModel.getField.restore();
                WobjModel.updateField.restore();
            } );
            it( 'should update field rating_votes to "rating" field', () => {
                expect( updField ).to.include.key( 'rating_votes' );
            } );
            it( 'should update field rating_votes to "rating" field with new values', () => {
                expect( updField.rating_votes[ 0 ] ).to.be.deep.eq( { voter: voter.name, rate: 10 } );
            } );
            it( 'should call "getField" on wobject model once', () => {
                expect( WobjModel.getField ).to.be.calledOnce;
            } );
            it( 'should call "updateField" on wobject model once', () => {
                expect( WobjModel.updateField ).to.be.calledTwice;
            } );
        } );
        describe( 'on not valid operation data', async () => {
            let mockOp, wobject, field, voter, updField;
            beforeEach( async () => {
                voter = ( await UserFactory.Create() ).user;
                sinon.spy( WobjModel, 'getField' );
                sinon.spy( WobjModel, 'updateField' );
                const append = await AppendObject.Create( { name: 'rating', body: getRandomString( 10 ) } );
                wobject = append.wobject;
                field = append.appendObject;
                mockOp = {
                    json: JSON.stringify( {
                        author: field.author,
                        permlink: field.permlink,
                        author_permlink: wobject.author_permlink
                    } ),
                    required_posting_auths: [ voter.name ]
                };
                sinon.spy( console, 'error' );
                await ratingHelper.parse( mockOp );
                updField = ( await WObject.findOne( wobject._id ).lean() ).fields[ 0 ];
            } );
            afterEach( () => {
                console.error.restore();
                WobjModel.getField.restore();
                WobjModel.updateField.restore();
            } );
            it( 'should not field rating_votes to "rating" field', () => {
                expect( updField ).to.not.include.key( 'rating_votes' );
            } );
            it( 'should not call method "getField" on wobject model', () => {
                expect( WobjModel.getField ).to.not.be.called;
            } );
            it( 'should log to console message error', () => {
                expect( console.error ).to.be.called;
            } );
            it( 'should log to console correct message', () => {
                expect( console.error ).to.be.calledOnceWith( 'Rating vote data is not valid!' );
            } );
        } );
        describe( 'on not valid operation stringified json', async () => {
            let mockOp;
            beforeEach( async () => {
                mockOp = {
                    required_posting_auths: [ 'test' ],
                    json: '{"this_is":"not valid json}'
                };
                sinon.spy( console, 'error' );
                sinon.spy( WobjModel, 'getField' );
                sinon.spy( WobjModel, 'updateField' );
                await ratingHelper.parse( mockOp );
            } );
            afterEach( () => {
                console.error.restore();
                WobjModel.getField.restore();
                WobjModel.updateField.restore();
            } );

            it( 'should not call method "getField" on wobject model', () => {
                expect( WobjModel.getField ).to.not.be.called;
            } );
            it( 'should not call method "updateField" on wobject model', () => {
                expect( WobjModel.updateField ).to.not.be.called;
            } );
            it( 'should log to console message error', () => {
                expect( console.error ).to.be.called;
            } );
        } );
    } );
} );
