const { expect, appHelper } = require( '../../testHelper' );
const { AppFactory } = require( '../../factories' );

describe( 'App Helper', async () => {
    describe( 'Check app on blacklist validity', () => {
        let app;

        before( async () => {
            app = await AppFactory.Create( {
                blacklists: {
                    apps: [ 'apptest/1.0.0', 'lala/1.0.0', 'kek/1.0.0' ]
                }
            } );
            process.env.APP_NAME = app.name;
        } );
        it( 'should return false on validating app', async () => {
            const res = await appHelper.checkAppBlacklistValidity( { app: 'apptest' } );

            expect( res ).to.be.true;
        } );
        it( 'should return false on validating app', async () => {
            const res = await appHelper.checkAppBlacklistValidity( { app: 'kek' } );

            expect( res ).to.be.true;
        } );
        it( 'should return false on validating app', async () => {
            const res = await appHelper.checkAppBlacklistValidity( { app: 'lal' } );

            expect( res ).to.be.true;
        } );
        it( 'should return true on validating app', async () => {
            const res = await appHelper.checkAppBlacklistValidity( { app: 'lalakek' } );

            expect( res ).to.be.true;
        } );
        it( 'should return true on validating app', async () => {
            const res = await appHelper.checkAppBlacklistValidity( { app: 'apptst' } );

            expect( res ).to.be.true;
        } );
        it( 'should return true on validating app', async () => {
            const res = await appHelper.checkAppBlacklistValidity( { app: 'H2O' } );

            expect( res ).to.be.true;
        } );
    } );
} );
