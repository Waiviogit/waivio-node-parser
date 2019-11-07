const { expect, AppModel, getRandomString } = require( '../../testHelper' );
const { AppFactory } = require( '../../factories' );

describe( 'App model', async () => {
    describe( 'Check app on get one', () => {
        let app, result;

        before( async () => {
            app = await AppFactory.Create( {
                name: 'empty'
            } );
        } );
        it( 'Should successful to eq names', async () => {
            result = await AppModel.getOne( { name: app.name } );
            expect( result.app ).to.deep.eq( app._doc );
        } );

        it( ' Should success return error', async () => {
            result = await AppModel.getOne( { name: getRandomString() } );
            expect( result.error ).is.exist;
        } );
        it( ' Should return error message', async () => {
            result = await AppModel.getOne( { name: 'notfound' } );
            expect( result.error.message ).to.deep.eq( 'App not found!' );
        } );
    } );
} );

