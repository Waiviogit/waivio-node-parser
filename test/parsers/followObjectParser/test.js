const { Mongoose, expect, getRandomString, faker } = require( '../../testHelper' );
const { followObjectParser } = require( '../../../parsers' );
const mock = require( './mock' );

describe( 'followObjectParser', async () => {
    describe( 'On followObjectParse and errors', async () => {
        let data, result, name, author_permlink;
        beforeEach( async () => {
            await Mongoose.connection.dropDatabase();
            name = faker.name.firstName();
            author_permlink = getRandomString( 10 );
            data = await mock.dataForFollow( { follow: true, auth_permlink: author_permlink, userName: name } );
        } );
        it( 'should success follow to wobject', async () => {
            result = await followObjectParser.parse( data );
            expect( result ).to.eq( `User ${name} now following wobject ${author_permlink}!\\n` );
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
            result = await followObjectParser.parse( { json: '["follow",{"user": "name","author_permlink": "name","what":[{"some":"test"}]}]' } );
            expect( result.status ).to.eq( 404 );
        } );
    } );
    describe( 'On unfollowObjectParse', async () => {
        let data, result, name, author_permlink;
        before( async () => {
            await Mongoose.connection.dropDatabase();
            name = faker.name.firstName();
            author_permlink = getRandomString( 10 );
            data = await mock.dataForFollow( { auth_permlink: author_permlink, userName: name } );
        } );
        it( 'should success unfollow', async () => {
            result = await followObjectParser.parse( data );
            expect( result ).to.deep.eq( `User ${name} now unfollow wobject ${author_permlink} !\n` );
        } );
    } );
} );
