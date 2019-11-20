const { userParsers, User, expect, sinon, Post, getRandomString, faker } = require( '../../testHelper' );
const { UserFactory, PostFactory } = require( '../../factories' );
const { User: UserModel } = require( '../../../models' );

describe( 'UserParsers', async () => {
    describe( 'on updateAccountParse', async () => {
        let updUser;
        const mock_metadata = { profile: { name: 'Alias Name' } };

        before( async () => {
            const { user: mockUser } = await UserFactory.Create();

            await userParsers.updateAccountParser( {
                account: mockUser.name,
                json_metadata: JSON.stringify( mock_metadata )
            } );
            updUser = await User.findOne( { name: mockUser.name } ).lean();
        } );

        it( 'should update existing account', () => {
            expect( updUser ).to.include.key( 'json_metadata' );
        } );
        it( 'should update json_metadata correct', () => {
            expect( updUser.json_metadata ).to.equal( JSON.stringify( mock_metadata ) );
        } );
        it( 'should update existing account and add alias key', () => {
            expect( updUser ).to.include.key( 'alias' );
        } );
        it( 'should update alias name correct', () => {
            expect( updUser.alias ).to.equal( 'Alias Name' );
        } );
        it( 'should not create user if update was on non exist user', async () => {
            await userParsers.updateAccountParser( {
                account: 'nonexistuser',
                json_metadata: '{hello: world}'
            } );
            const user = await User.findOne( { name: 'nonexistuser' } );

            expect( user ).to.not.exist;
        } );
    } );

    describe( 'on followUserParser', async () => {
        describe( 'on valid input data', async () => {
            let usr;
            let usr2;
            let usr3;

            before( async () => {
                const { user } = await UserFactory.Create();
                const { user: user2 } = await UserFactory.Create();
                const { user: user3 } = await UserFactory.Create();

                usr = user;
                usr2 = user2;
                usr3 = user3;
                await User.update( { name: user2.name }, { users_follow: [ 'tstusernamefllw' ] } );
                await userParsers.followUserParser( {
                    json: JSON.stringify( [
                        'follow',
                        {
                            follower: user.name,
                            following: 'tstusernamefllw',
                            what: [ 'blog' ]
                        }
                    ] )
                } );
                await userParsers.followUserParser( {
                    json: JSON.stringify( [
                        'follow',
                        {
                            follower: user2.name,
                            following: 'tstusernamefllw',
                            what: []
                        }
                    ] )
                } );
                await userParsers.followUserParser( {
                    json: JSON.stringify( [
                        'follow',
                        {
                            follower: user2.name,
                            following: 'tstusernamefllw',
                            what: [ 'ignore' ]
                        }
                    ] )
                } );
            } );
            it( 'should add user to follow list', async () => {
                let user = await User.findOne( { name: usr.name } ).lean();
                expect( user.users_follow ).to.include( 'tstusernamefllw' );
            } );
            it( 'should remove user from follow list', async () => {
                let user = await User.findOne( { name: usr2.name } ).lean();
                expect( user.users_follow ).to.be.empty;
            } );
            it( 'should not follow if in "what" field key "ignore"', async () => {
                let user = await User.findOne( { name: usr3.name } ).lean();
                expect( user.users_follow ).to.be.empty;
            } );
        } );

        describe( 'if first param in JSON is "reblog"', async () => {
            let mockJson, reblogParserStub, addUserFollowStub, removeUserFollowStub;
            before( async () => {
                reblogParserStub = sinon.stub( userParsers, 'reblogPostParser' ).returns( 0 );
                addUserFollowStub = sinon.stub( UserModel, 'addUserFollow' ).returns( {} );
                removeUserFollowStub = sinon.stub( UserModel, 'removeUserFollow' ).returns( {} );
                mockJson = [ 'reblog', { account: faker.name.firstName(), author: faker.name.firstName(), permlink: getRandomString( 15 ) } ];
                await userParsers.followUserParser( { json: JSON.stringify( mockJson ) } );
            } );
            after( () => {
                reblogParserStub.restore();
                addUserFollowStub.restore();
                removeUserFollowStub.restore();
            } );

            it( 'should call "reblogPostParser" once', () => {
                expect( reblogParserStub ).to.be.called;
            } );

            it( 'should call "reblogPostParser" with correct params', () => {
                expect( reblogParserStub ).to.be.calledWith( mockJson );
            } );

            it( 'should not call addUserFollow on user model', () => {
                expect( addUserFollowStub ).to.be.not.called;
            } );

            it( 'should not call removeUserFollow on user model', () => {
                expect( removeUserFollowStub ).to.be.not.called;
            } );
        } );
    } );

    describe( 'on reblogPostParser', async () => {
        describe( 'on valid json', async () => {
            let post, user, reblog_post;
            beforeEach( async () => {
                post = await PostFactory.Create();
                const { user: userMock } = await UserFactory.Create();
                user = userMock;
                await userParsers.reblogPostParser( [
                    'reblog',
                    { account: user.name, author: post.author, permlink: post.permlink }
                ] );
                reblog_post = await Post.findOne( { author: post.author, permlink: post.permlink, reblog_by: user.name } );
            } );
            it( 'should create new post with field reblog_by not null', () => {
                expect( reblog_post.reblog_by ).to.not.null;
            } );
            it( 'should create new post with correct field reblog_by', () => {
                expect( reblog_post.reblog_by ).to.be.eq( user.name );
            } );
            it( 'should not edit source post', async () => {
                const sourcePost = await Post.findOne( { _id: post._id } );
                expect( post ).to.deep.eq( sourcePost._doc );
            } );
        } );
    } );
} );
