const { expect, AppModel, getRandomString, faker } = require( '../../testHelper' );
const { AppFactory } = require( '../../factories' );

describe( 'App model', async () => {
    describe( 'On getOne', () => {
        let app, result;

        before( async () => {
            app = await AppFactory.Create( {
                name: getRandomString()
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
            result = await AppModel.getOne( { name: getRandomString() } );
            expect( result.error.message ).to.deep.eq( 'App not found!' );
        } );
    } );
    describe( 'On updateChosenPost', async () => {
        let app, result, name, author, permlink, title;
        beforeEach( async () => {
            author = faker.name.firstName();
            permlink = getRandomString();
            title = getRandomString( 20 );
            name = faker.name.firstName();
            app = await AppFactory.Create( { name: name } );
        } );
        it( 'should success update daily post', async () => {
            result = await AppModel.updateChosenPost( { name: name, author: author, permlink: permlink, title: title } );
            expect( app.daily_chosen_post ).not.deep.eq( result.app.daily_chosen_post );
        } );
        it( 'should not update weekly post', async () => {
            result = await AppModel.updateChosenPost( { name: name, author: author, permlink: permlink, title: title } );
            expect( app.weekly_chosen_post ).deep.eq( result.app.weekly_chosen_post );
        } );
        it( 'should success update weekly post', async () => {
            result = await AppModel.updateChosenPost( { name: name, author: author, permlink: permlink, title: title, period: 'weekly' } );
            expect( app.weekly_chosen_post ).not.deep.eq( result.app.weekly_chosen_post );
        } );
        it( 'should not update app with not full data', async () => {
            result = await AppModel.updateChosenPost( { name: name, permlink: permlink, title: title, period: 'weekly' } );
            expect( result.app.weekly_chosen_post.author ).is.null;
        } );
        it( 'should return error without data', async () => {
            result = await AppModel.updateChosenPost( {} );
            expect( result.app ).is.null;
        } );
        it( 'should not update app with incorrect period', async () => {
            result = await AppModel.updateChosenPost( { name: name, author: author, permlink: permlink, title: title, period: getRandomString() } );
            expect( result.app.weekly_chosen_post, result.app.daily_chosen_post ).to.deep.eq( app.weekly_chosen_post, app.daily_chosen_post );
        } );

    } );
} );

