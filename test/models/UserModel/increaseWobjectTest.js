const { expect, UserModel, User } = require( '../../testHelper' );
const { UserFactory, ObjectFactory, AppendObject } = require( '../../factories' );
/*
Tests for some methods of UserModel:
   increaseWobjectWeight,
   checkForObjectShares,
   addUserFollow,
   removeUserFollow,
   addObjectFollow,
   removeObjectFollow,

 */

describe( 'User Model', async () => {
    describe( 'On increaseWobjectsWeight', async () => {
        let data, data2, weightIncrease;
        before( async() => {
            await UserFactory.Create( { name: 'Test' } );
            data = {
                name: 'Test',
                author: 'TestAuthor',
                author_permlink: 'TestPermlink',
                weight: 50
            };
            data2 = {
                name: 'Test2',
                author: 'TestAuthor2',
                author_permlink: 'TestPermlink2',
                weight: 1000
            };
            const tmp = await User.findOneAndUpdate( { name: 'Test2' }, { count_posts: 123 }, { upsert: false } );
            weightIncrease = await UserModel.increaseWobjectWeight( data );
        } );
        it( 'should return true', async () => {

            expect( weightIncrease.result ).is.true;
        } );
        it( 'should increaseWeight', async () => {
            let foundedUser = await User.findOne( { name: data.name } );

            expect( foundedUser._doc.wobjects_weight ).to.deep.eq( data.weight );
        } );
        it( 'should create new user if it not exist', async () => {

            weightIncrease = await UserModel.increaseWobjectWeight( data2 );
            let foundedUser = await User.findOne( { name: data2.name } );

            expect( foundedUser ).is.exist;
        } );

        it( 'should increase weight after create new user', async () => {
            let foundedUser = await User.findOne( { name: data2.name } );

            expect( foundedUser._doc.wobjects_weight ).to.deep.eq( data2.weight );
        } );

    } );
    describe( 'On checkForObjectShares', async () => {
        let data, user, wobject;
        before( async () => {
            wobject = await AppendObject.Create();
            data = {
                name: wobject.wobject.author,
                author_permlink: wobject.wobject.author_permlink
            };

            user = await UserModel.create(

            );
        } );

        it( 'should ', async () => {
            let result = await UserModel.checkForObjectShares( data );
        } );
    } );
    describe( 'On addUserFollow', async () => {
        let follower, following, result;
        before( async() => {
            follower = await UserFactory.Create( );
            following = await UserFactory.Create( );
            await UserModel.addUserFollow( { follower: follower.user.name, following: following.user.name } );
            result = await User.findOne( { name: follower.user.name } );
        } );
        it( 'should users_follow contains following name', async () => {
            expect( result._doc.users_follow ).to.contain( following.user.name );
        } );
        it( 'should users_follow length bigger then 0', async () => {
            expect( result._doc.users_follow.length > 0 ).is.true;
        } );
    } );
    describe( 'On removeUserFollow', async () => {
        let follower, following, result;
        before( async () => {
            follower = await UserFactory.Create();
            following = await UserFactory.Create();
            follower.user.users_follow = [ following.user.name ];
        } );
        it( 'should users_follow length bigger then 0', async () => {
            expect( follower.user.users_follow.length > 0 ).is.true;
        } );
        it( 'should user_follow do not exist following', async () => {
            await UserModel.removeUserFollow( { follower: follower.user.name, following: following.user.name } );
            result = await User.findOne( { name: follower.user.name } );
            expect( result._doc.users_follow ).to.not.contain( following.user.name );
        } );
        it( 'should follower user_follow is empty', async () => {
            result = await User.findOne( { name: follower.user.name } );
            expect( result._doc.users_follow ).is.empty;
        } );
    } );
    describe( 'On addObjectFollow', async () => {
        let data, fakeObject, result, follower;
        before( async () => {
            follower = await UserFactory.Create();
            fakeObject = await ObjectFactory.Create();
            data = {
                user: follower.user.name,
                author_permlink: fakeObject.author_permlink
            };
            await UserModel.addObjectFollow( data );
            result = await User.findOne( { name: follower.user.name } );
        } );
        it( 'should follower object_follow is not empty', async () => {
            expect( result._doc.objects_follow ).not.empty;
        } );
        it( 'should follower object_follow contains fakeObject', async () => {
            expect( result._doc.objects_follow ).to.contain( fakeObject.author_permlink );
        } );
    } );
    describe( 'On removeObjectFollow ', async () => {
        let data, fakeObject, result, follower;
        before( async () => {
            follower = await UserFactory.Create();
            fakeObject = await ObjectFactory.Create();
            data = {
                user: follower.user.name,
                author_permlink: fakeObject.author_permlink
            };
            await UserModel.addObjectFollow( data );
        } );
        it( 'should follower object_follow contains fakeObject', async () => {
            result = await User.findOne( { name: follower.user.name } );
            expect( result._doc.objects_follow ).not.empty;
        } );
        it( 'should success remove objects_follow', async () => {
            await UserModel.removeObjectFollow( data );
            result = await User.findOne( { name: follower.user.name } );

            expect( result._doc.objects_follow ).to.not.contain( fakeObject.author_permlink );
        } );
        it( 'should success empty objects_follow array', async () => {
            await UserModel.removeObjectFollow( data );
            result = await User.findOne( { name: follower.user.name } );

            expect( result._doc.objects_follow ).is.empty;
        } );
    } );
} );
