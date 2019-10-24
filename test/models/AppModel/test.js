const { expect, AppModel } = require( '../../testHelper' );
const { AppFactory } = require( '../../factories' );

describe( 'App model', async () => {
    describe( 'Check app on get one', () => {
        let app;

        before( async () => {
            app = await AppFactory.Create( {
                name: 'empty'
            } );
        } );
        it( 'Should successful to eq names', async () => {
            const result = await AppModel.getOne( { name: app.name } );

            expect( result.app ).to.deep.eq( app._doc );
        } );
        it( ' Should return error message', async () => {
            const res = await AppModel.getOne( { name: 'notfound' } );
            expect( res.error.message ).to.deep.eq( 'App not found!' );
        } );
    } );
} );

