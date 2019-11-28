const { dropDatabase, expect, getRandomString, faker, sinon } = require( '../../testHelper' );
const { followObjectParser } = require( '../../../parsers' );
const mock = require( './mock' );
const { User, Wobj } = require( '../../../models' );

describe( 'followObjectParser', async () => {
    describe( 'On followObjectParse and errors', async () => {
        let data, result, name, author_permlink;
        beforeEach( async () => {
            sinon.stub( User, 'addObjectFollow' ).callsFake( () => ( { result: true } ) );
            sinon.stub( Wobj, 'getOne' ).callsFake( () => ( { wobject: true } ) );
            await dropDatabase();
            name = faker.name.firstName();
            author_permlink = getRandomString( 10 );
            data = await mock.dataForFollow( { follow: true, auth_permlink: author_permlink, userName: name } );
        } );
        afterEach( () => {
            sinon.restore();
        } );
        it( 'should success follow to wobject', async () => {
            result = await followObjectParser.parse( data );
            expect( result ).to.eq( `User ${name} now following wobject ${author_permlink}!\n` );
        } );
        it( 'should get error with incorrect data', async () => {
            result = await followObjectParser.parse( getRandomString( 20 ) );
            expect( result.message ).to.eq( 'Unexpected token u in JSON at position 0' );
        } );
        it( 'should not work without author_permlink', async () => {
            result = await followObjectParser.parse( { json: '["follow",{"user": "name","what":[]}]' } );
            expect( result ).is.undefined;
        } );
        it( 'should not work without author', async () => {
            result = await followObjectParser.parse( { json: '["follow",{"author_permlink": "name","what":[]}]' } );
            expect( result ).is.undefined;
        } );
        it( 'should not work without what', async () => {
            result = await followObjectParser.parse( { json: '["follow",{"author_permlink": "name","what":[]}]' } );
            expect( result ).is.undefined;
        } );
        it( 'should trying to follow to not exist wobject', async () => {
            sinon.restore();
            sinon.stub( Wobj, 'getOne' ).callsFake( () => ( { error: { status: 404, message: 'Wobject not found!' } } ) );
            result = await followObjectParser.parse( { json: '["follow",{"user": "name","author_permlink": "name","what":[{"some":"test"}]}]' } );
            expect( result.status ).to.eq( 404 );
        } );
    } );
    describe( 'On unfollowObjectParse', async () => {
        let data, result, name, author_permlink;
        beforeEach( async () => {
            await dropDatabase();
            sinon.stub( User, 'removeObjectFollow' ).callsFake( () => {
                return { result: true };
            } );
            name = faker.name.firstName();
            author_permlink = getRandomString( 10 );
            data = await mock.dataForFollow( { auth_permlink: author_permlink, userName: name } );
        } );
        afterEach( async () => {
            sinon.restore();
        } );
        it( 'should success unfollow', async () => {
            result = await followObjectParser.parse( data );
            expect( result ).to.deep.eq( `User ${name} now unfollow wobject ${author_permlink} !\n` );
        } );
    } );
} );
