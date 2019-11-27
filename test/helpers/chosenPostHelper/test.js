const { expect, postsUtil, sinon, getRandomString, App, faker, AppModel } = require( '../../testHelper' );
const { AppFactory } = require( '../../factories' );
const { chosenPostHelper } = require( '../../../utilities/helpers' );

describe( 'chosenPostHelper', async () => {
    describe( 'on getPeriodFromBodyStr', () => {
        let tests = [
            { body: '#daily @waivio', exp_res: 'daily' },
            { body: '#weekly @lalalend', exp_res: 'weekly' },
            { body: '#dail @kek', exp_res: undefined },
            { body: '#weekl @test', exp_res: undefined }
        ];

        tests.forEach( ( test ) => {
            it( `should return "${test.exp_res}" for input body: ${test.body} `, () => {
                expect( chosenPostHelper.getPeriodFromBodyStr( test.body ) ).to.eq( test.exp_res );
            } );
        } );
    } );

    describe( 'on getAppFromBodyStr', () => {
        let tests = [
            { body: '#daily @waivio', exp_res: 'waivio' },
            { body: '#weekly @lalalend', exp_res: 'lalalend' },
            { body: '#daily @kek', exp_res: 'kek' },
            { body: '#weekl @test', exp_res: undefined },
            { body: '#daily @te', exp_res: undefined },
            { body: '#daily @steemit com', exp_res: 'steemit' }
        ];

        tests.forEach( ( test ) => {
            it( `should return "${test.exp_res}" for input body: ${test.body} `, () => {
                expect( chosenPostHelper.getAppFromBodyStr( test.body ) ).to.eq( test.exp_res );
            } );
        } );
    } );

    describe( 'on updateAppChosenPost', async () => {
        describe( 'on valid all data', async () => {
            let app, resp_user_name, mock_op, postUtilStub, upd_app, mock_res_data;
            beforeEach( async () => {
                resp_user_name = getRandomString( 6 );
                app = await AppFactory.Create( { admin: resp_user_name } );
                mock_op = {
                    parent_author: 'mock_post_author',
                    parent_permlink: 'mock_post_permlink',
                    author: resp_user_name,
                    permlink: 'mock_permlink',
                    body: `#daily @${app.name}`
                };
                postUtilStub = sinon.stub( postsUtil, 'getPost' ).callsFake( async ( a, b ) => {
                    return {
                        post: {
                            author: 'mock_post_author',
                            permlink: 'mock_post_permlink',
                            title: 'mock_title'
                        }
                    };
                } );
                mock_res_data = { author: mock_op.parent_author, permlink: mock_op.parent_permlink, title: 'mock_title' };
                await chosenPostHelper.updateAppChosenPost( mock_op );
                upd_app = await App.findOne( { name: app.name } ).lean();
            } );
            afterEach( () => {
                postUtilStub.restore();
            } );
            it( 'should update "App" with field "daily_chosen_post"', async () => {
                expect( upd_app ).to.include.key( 'daily_chosen_post' );
            } );
            it( 'should update "App" with correct data of"daily_chosen_post"', async () => {
                expect( upd_app.daily_chosen_post ).to.deep.eq( mock_res_data );
            } );
        } );

        describe( 'on invalid app name', async () => {
            let mock_op, postUtilStub;
            beforeEach( async () => {
                mock_op = {
                    parent_author: faker.name.firstName(),
                    parent_permlink: getRandomString( 10 ),
                    author: faker.name.firstName(),
                    permlink: getRandomString( 10 ),
                    body: `#daily @${getRandomString( 5 )}`
                };
                postUtilStub = sinon.stub( postsUtil, 'getPost' ).callsFake( async ( a, b ) => {
                    return {
                        post: {
                            author: mock_op.parent_author,
                            permlink: mock_op.parent_permlink,
                            title: getRandomString( 10 )
                        }
                    };
                } );
                sinon.spy( console, 'error' );
                await chosenPostHelper.updateAppChosenPost( mock_op );
            } );
            afterEach( () => {
                postUtilStub.restore();
                console.error.restore();
            } );
            it( 'should call "console.error" once', () => {
                expect( console.error ).to.be.calledOnce;
            } );
            it( 'should not call "getPost" on "postsUtil"', () => {
                expect( postUtilStub ).to.not.be.called;
            } );
        } );

        describe( 'on "getPost" error result', async () => {
            let app, resp_user_name, mock_op, postUtilStub;
            beforeEach( async () => {
                resp_user_name = getRandomString( 6 );
                app = await AppFactory.Create( { admin: resp_user_name } );
                mock_op = {
                    parent_author: faker.name.firstName(),
                    parent_permlink: getRandomString( 10 ),
                    author: resp_user_name,
                    permlink: getRandomString( 10 ),
                    body: `#daily @${app.name}`
                };
                postUtilStub = sinon.stub( postsUtil, 'getPost' ).callsFake( async ( a, b ) => {
                    return { err: { message: 'This is test!' } };
                } );
                sinon.spy( console, 'error' );
                sinon.spy( AppModel, 'updateChosenPost' );
                await chosenPostHelper.updateAppChosenPost( mock_op );
            } );
            afterEach( () => {
                postUtilStub.restore();
                console.error.restore();
                AppModel.updateChosenPost.restore();
            } );
            it( 'should call "console.error" once', () => {
                expect( console.error ).to.be.calledOnce;
            } );
            it( 'should not call "updateChosenPost" on "AppModel"', () => {
                expect( AppModel.updateChosenPost ).to.not.be.called;
            } );
        } );

        describe( 'on "updateChosenPost" error result', async () => {
            let app, resp_user_name, mock_op, postUtilStub, appModelStub;
            beforeEach( async () => {
                resp_user_name = getRandomString( 6 );
                app = await AppFactory.Create( { admin: resp_user_name } );
                mock_op = {
                    parent_author: faker.name.firstName(),
                    parent_permlink: getRandomString( 10 ),
                    author: resp_user_name,
                    permlink: getRandomString( 10 ),
                    body: `#daily @${app.name}`
                };
                postUtilStub = sinon.stub( postsUtil, 'getPost' ).callsFake( async ( a, b ) => {
                    return { post: { author: mock_op.parent_author, permlink: mock_op.parent_permlink, title: 'test' } };
                } );
                appModelStub = sinon.stub( AppModel, 'updateChosenPost' ).callsFake( async () => {
                    return { error: { message: 'test error message' } };
                } );
                sinon.spy( console, 'error' );
                sinon.spy( console, 'log' );
                await chosenPostHelper.updateAppChosenPost( mock_op );
            } );
            afterEach( () => {
                postUtilStub.restore();
                console.error.restore();
                console.log.restore();
                appModelStub.restore();
            } );
            it( 'should call "console.error" once', () => {
                expect( console.error ).to.be.calledOnce;
            } );
            it( 'should call console.error with correct message', () => {
                expect( console.error ).to.be.calledOnceWith( { message: 'test error message' } );
            } );
        } );
    } );
} );
