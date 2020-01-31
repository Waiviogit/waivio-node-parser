const { userParsers, User, expect, sinon, Post, faker } = require( '../../testHelper' );
const { UserFactory, PostFactory } = require( '../../factories' );
const { User: UserModel } = require( '../../../models' );
const _ = require( 'lodash' );

describe( 'UserParsers', async () => {
    describe( 'on updateAccountParse', async () => {
        let updUser;
        const mock_metadata = { profile: { name: 'Alias Name' } };

        beforeEach( async () => {
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

            beforeEach( async () => {
                const { user } = await UserFactory.Create();
                const { user: user2 } = await UserFactory.Create();
                const { user: user3 } = await UserFactory.Create();

                usr = user;
                usr2 = user2;
                usr3 = user3;
                await User.update( { name: user2.name }, { users_follow: [ 'tstusernamefllw' ] } );
                await userParsers.followUserParser( {
                    required_posting_auths: [ user.name ],
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
                    required_posting_auths: [ user2.name ],
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
                    required_posting_auths: [ user2.name ],
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
            beforeEach( async () => {
                reblogParserStub = sinon.stub( userParsers, 'reblogPostParser' ).returns( 0 );
                addUserFollowStub = sinon.stub( UserModel, 'addUserFollow' ).returns( {} );
                removeUserFollowStub = sinon.stub( UserModel, 'removeUserFollow' ).returns( {} );
                mockJson = [ 'reblog', { account: faker.name.firstName(), author: faker.name.firstName(), permlink: faker.random.string( 15 ) } ];
                await userParsers.followUserParser( {
                    json: JSON.stringify( mockJson ),
                    required_posting_auths: [ mockJson[ 1 ].account ]
                } );
            } );
            afterEach( () => {
                reblogParserStub.restore();
                addUserFollowStub.restore();
                removeUserFollowStub.restore();
            } );

            it( 'should call "reblogPostParser" once', () => {
                expect( reblogParserStub ).to.be.called;
            } );

            it( 'should call "reblogPostParser" with correct params', () => {
                expect( reblogParserStub ).to.be.calledWith( { json: mockJson, account: mockJson[ 1 ].account } );
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
            let post, user, reblog_post, upd_source_post, mockInput;
            beforeEach( async () => {
                post = await PostFactory.Create( {
                    additionsForPost: {
                        wobjects: [
                            { author_permlink: faker.random.string( 10 ), percent: 50 },
                            { author_permlink: faker.random.string( 10 ), percent: 50 }
                        ],
                        language: 'ru-RU'
                    }
                } );
                const { user: userMock } = await UserFactory.Create();
                user = userMock;
                mockInput = {
                    json: [ 'reblog', { account: user.name, author: post.author, permlink: post.permlink } ],
                    account: user.name
                };
                await userParsers.reblogPostParser( mockInput );
                upd_source_post = await Post.findOne( { author: post.author, permlink: post.permlink } ).lean();
                reblog_post = await Post.findOne( { author: user.name, permlink: `${post.author}/${post.permlink}` } ).lean();
            } );
            it( 'should create new post with field reblog_to not null', () => {
                expect( reblog_post.reblog_to ).to.not.null;
            } );
            it( 'should create new post with correct field reblog_to', () => {
                expect( reblog_post.reblog_to ).to.deep.eq( _.pick( post, [ 'author', 'permlink' ] ) );
            } );
            it( 'should not edit source post', async () => {
                expect( post ).to.deep.eq( upd_source_post );
            } );
            it( 'should duplicate all source post wobjects', () => {
                expect( reblog_post.wobjects ).to.deep.eq( post.wobjects );
            } );
            it( 'should duplicate source post language', () => {
                expect( reblog_post.language ).to.eq( post.language );
            } );
        } );
    } );
} );
