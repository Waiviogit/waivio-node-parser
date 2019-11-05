const { expect, UserModel, User } = require( '../../testHelper' );
const { UserFactory } = require( '../../factories' );
/*
Tests for some methods of UserModel:
    create,
    update,
    updateOne,
    checkAndCreate,
    increaseCountPosts
 */
describe( 'User Model', async () => {
    describe( 'On create', async () => {
        let createdUserModel, user, data;
        before( async () => {
            data = {
                name: 'testUser',
                alias: 'testAlias'
            };
            createdUserModel = await UserModel.create( data );
            user = createdUserModel.user;
        } );
        it( 'should success exist created user', async () => {
            expect( user ).is.exist;
        } );
        it( 'should user name eq data name', async () => {
            expect( data ).to.deep.eq( { name: user._doc.name, alias: user._doc.alias } );
        } );
        it( 'should success find created user in database', async () => {
            let findUser = await User.findOne( data );
            expect( findUser._doc.name ).to.deep.eq( user._doc.name );
        } );
    } );
    describe( 'On update', async () => {
        let user1, user2, updateData, condition, updatedUser, updatedUser2, result;
        before( async () => {
            user2 = await UserFactory.Create();
            user1 = await UserFactory.Create();

            condition = {
                count_posts: 0
            };
            updateData = {
                $set: {
                    wobjects_weight: 1111
                }
            };
            result = await UserModel.update( condition, updateData );
            updatedUser = await User.findOne( { name: user1.user.name } );
            updatedUser2 = await User.findOne( { name: user2.user.name } );
        } );
        it( 'should result ok 1', async () => {
            expect( result.result.ok ).to.deep.eq( 1 );
        } );
        it( 'should update user success', async () => {
            expect( user1.user.wobjects_weight ).to.not.eq( updatedUser._doc.wobjects_weight );
        } );
        it( 'should update second user success', async () => {
            expect( user2.user.wobjects_weight ).to.not.eq( updatedUser2._doc.wobjects_weight );
        } );
    } );
    describe( 'On update one', async () => {
        let firstUser, updateData, condition, updatedUser;
        before( async() => {
            firstUser = await UserFactory.Create();
            updateData = {
                wobjects_weight: 100
            };
            condition = {
                name: firstUser.user.name
            };
            await UserModel.updateOne( condition, updateData );
            updatedUser = await User.findOne( { name: firstUser.user.name } );
        } );
        it( 'should success update user', async () => {
            expect( firstUser.user.wobjects_weight ).to.not.eq( updatedUser._doc.wobjects_weight );
        } );
        it( 'should success update user by updateData', async () => {
            expect( updatedUser._doc.wobjects_weight ).to.deep.eq( updateData.wobjects_weight );
        } );
    } );
    describe( 'On check and create', async () => {
        let user, checkedUser, foundedUser, data;
        before( async () => {
            data = {
                name: 'testUser'
            };
            user = await UserFactory.Create( { name: 'Test' } );
            checkedUser = await UserModel.checkAndCreate( data );
            foundedUser = await User.findOne( data );
        } );
        it( 'should return user', async () => {
            let checkedExistUser = await UserModel.checkAndCreate( { name: 'Test' } );

            expect( user.user._id ).to.deep.eq( checkedExistUser.user._id );
        } );
        it( 'should create new user if user not exist', async () => {

            expect( foundedUser ).is.exist;
        } );
        it( 'should check that created user has needed name', async () => {

            expect( foundedUser.name ).to.deep.eq( data.name );
        } );
        it( 'should eq checkedUser and database findOne user', async () => {

            expect( checkedUser.user._id ).to.deep.eq( foundedUser._doc._id );
        } );
    } );
    describe( 'On increaseCountPosts', async () => {
        let author, result, updatedAuthor;
        before( async () => {
            author = await UserFactory.Create();
            result = await UserModel.increaseCountPosts( author.user.name );
            updatedAuthor = await User.findOne( { name: author.user.name } );
        } );
        it( 'should return result true', async () => {
            expect( result.result ).is.true;
        } );
        it( 'should update count posts success', async () => {
            expect( author.user.count_posts ).to.not.deep.eq( updatedAuthor._doc.count_posts );
        } );
        it( 'should success update count posts by 1', async () => {
            expect( author.user.count_posts + 1 ).to.deep.eq( updatedAuthor._doc.count_posts );
        } );

    } );
} );

