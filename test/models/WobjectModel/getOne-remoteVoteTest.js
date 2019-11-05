const { expect, WobjModel, sinon, getRandomString } = require( '../../testHelper' );
const WObjectModel = require( '../../../database' ).models.WObject;
const { ObjectFactory } = require( '../../factories' );
/*
Tests for some methods of WobjectModel:
  getOne,
    create,
    update,
    addField,
    increaseFieldWeight,
    increaseWobjectWeight,
    removeVote
 */

describe( 'Wobject Model', async () => {
    describe( 'On getOne', async () => {
        let result, permlink;
        before( async () => {
            permlink = getRandomString();
            await ObjectFactory.Create( { author_permlink: permlink } );
        } );
        it( 'should success find wobject', async () => {
            result = await WobjModel.getOne( { author_permlink: permlink } );

            expect( result ).is.exist;
        } );
        it( 'should success find wobject with needed author permlink', async () => {
            result = await WobjModel.getOne( { author_permlink: permlink } );

            expect( result.wobject.author_permlink ).to.deep.eq( permlink );
        } );
        it( 'should return error status 404', async () => {
            result = await WobjModel.getOne( { author_permlink: 'some_permlink' } );

            expect( result.error.status ).to.deep.eq( 404 );
        } );
        it( 'should return error message', async () => {
            result = await WobjModel.getOne( { author_permlink: 'some_permlink' } );

            expect( result.error.message ).to.deep.eq( 'Wobject not found!' );
        } );
        it( 'should return CastError', async () => {
            result = await WobjModel.getOne( { author_permlink: { permlink } } );

            expect( result.error.name ).to.deep.eq( 'CastError' );
        } );
    } );
    describe( 'On create', async () => {
        let result, data;
        before( async () => {
            data = await ObjectFactory.Create( { onlyData: true } );
            await WobjModel.create( data );
        } );
        it( 'should success wobject created', async () => {
            result = await WObjectModel.findOne( { author_permlink: data.author_permlink } );

            expect( { author: result._doc.author, author_permlink: result._doc.author_permlink } )
                .to.deep.eq( { author: data.author, author_permlink: data.author_permlink } );
        } );
        it( 'should return error with not valid data', async () => {
            result = await WobjModel.create( { some: 'data' } );

            expect( result.error.name ).to.deep.eq( 'ValidationError' );
        } );
    } );
    describe( 'On update', async () => {
        let result, condition, updateData, permlink;
        before( async () => {
            permlink = getRandomString();
            await ObjectFactory.Create( { author_permlink: permlink } );
            condition = {
                weight: 1
            };
            updateData = {
                $set: {
                    count_posts: 1111
                }
            };
        } );
        it( 'should update field', async() => {
            result = await WobjModel.update( condition, updateData );

            expect( result.result.count_posts ).to.deep.eq( updateData.$set.count_posts );
        } );
        it( 'should return error', async () => {
            result = await WobjModel.update( 'hello', 'world' );

            expect( result.error ).is.exist;
        } );
        it( 'should didnt update with not valid data ', async () => {
            result = await WobjModel.update( 'hello', 'world' );
            let findPost = await WObjectModel.findOne( { author_permlink: permlink } );
            expect( findPost._doc.count_posts ).to.deep.eq( 0 );
        } );
    } );
    describe( 'On addField', async () => {

    } );
    describe( 'On increaseFieldWeight', async () => {

    } );
    describe( 'On increseWobjectWeight', async () => {

    } );
    describe( 'On remoteVote', async () => {

    } );
} );
