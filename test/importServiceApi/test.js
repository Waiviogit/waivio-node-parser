const { expect, importTags, sinon } = require( '../testHelper' );
const axios = require( 'axios' );

describe( 'Import Tags Service', async () => {
    describe( 'on success', async () => {
        let stub, result;
        beforeEach( async () => {
            stub = sinon.stub( axios, 'post' ).callsFake( async () => ( { data: 'this is mock data' } ) );
            result = await importTags.send( [ 'test' ] );
        } );

        afterEach( () => stub.restore() );

        it( 'should return response', () => expect( result ).to.has.key( 'response' ) );

        it( 'should return correct response', () => expect( result.response ).to.eq( 'this is mock data' ) );

        it( 'should not return error', () => expect( result ).to.not.has.key( 'error' ) );

        it( 'should call axios.post with correct data', () => {
            const secondArg = stub.getCall( 0 ).args[ 1 ];
            expect( secondArg ).to.deep.eq( { tags: [ 'test' ] } );
        } );

        it( 'should return undefined if input data is invalid', async () => {
            let res = await importTags.send( 'lala' );
            expect( res ).to.be.undefined;
        } );
    } );

    describe( 'on error', async () => {
        let stub, result;
        beforeEach( async () => {
            stub = sinon.stub( axios, 'post' ).callsFake( async () => {
                throw new Error( 'this is test' );
            } );
            result = await importTags.send( [ 'test' ] );
        } );

        afterEach( () => stub.restore() );

        it( 'should return error', () => {
            expect( result ).to.has.key( 'error' );
        } );

        it( 'should return correct error', () => {
            expect( result.error.message ).to.be.eq( 'this is test' );
        } );
    } );

    describe( 'on not enougt response data', async () => {
        let stub, result;
        beforeEach( async () => {
            stub = sinon.stub( axios, 'post' ).callsFake( async () => {
                return {};
            } );
            result = await importTags.send( [ 'test' ] );
        } );

        afterEach( () => stub.restore() );

        it( 'should return error', () => {
            expect( result ).to.has.key( 'error' );
        } );

        it( 'should return correct error', () => {
            expect( result.error.message ).to.be.eq( 'Not enough response data!' );
        } );
    } );
} );
