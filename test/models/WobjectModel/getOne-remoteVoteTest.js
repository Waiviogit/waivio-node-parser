const { expect, WobjModel, getRandomString } = require( '../../testHelper' );
const { ObjectType, WObject } = require( '../../../database' ).models;
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
            result = await WObject.findOne( { author_permlink: data.author_permlink } );

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
        beforeEach( async () => {
            permlink = getRandomString();
            await ObjectFactory.Create( { author_permlink: permlink } );
            condition = {
                author_permlink: permlink
            };
            updateData = {
                $set: {
                    count_posts: 1111
                }
            };
        } );
        afterEach( async () => {
            await WObject.deleteOne( { author_permlink: permlink } );
        } );
        it( 'should update field', async () => {
            await WobjModel.update( condition, updateData );
            result = await WObject.findOne( { author_permlink: permlink } );
            expect( result._doc.count_posts ).to.deep.eq( updateData.$set.count_posts );
        } );
        it( 'should return error', async () => {
            result = await WobjModel.update( 'hello', 'world' );

            expect( result.error ).is.exist;
        } );
        it( 'should return current error', async () => {
            result = await WobjModel.update( 'hello', 'world' );

            expect( result.error.message ).to.deep.eq( 'Conditions and updateData must be an object' );
        } );
        it( 'should didnt update with not valid data ', async () => {
            result = await WobjModel.update( 'hello', 'world' );
            let findPost = await WObject.findOne( { author_permlink: permlink } );
            expect( findPost._doc.count_posts ).to.deep.eq( 0 );
        } );
    } );
    describe( 'On addField', async () => {
        let result, data, permlink;
        before( async () => {
            permlink = getRandomString();
            await ObjectFactory.Create( { author_permlink: permlink } );
            data = {
                author_permlink: permlink,
                field: {
                    data: getRandomString()
                }
            };
        } );
        it( 'should success return true', async () => {
            result = await WobjModel.addField( data );
            expect( result.result ).is.true;
        } );
        it( 'should success return false', async () => {
            result = await WobjModel.addField( { author_permlink: getRandomString() } );

            expect( result.result ).is.false;
        } );
        it( 'should success addField to wobject', async () => {
            await WobjModel.addField( data );
            result = await WObject.findOne( { author_permlink: permlink } );

            expect( result._doc.fields[ 0 ]._doc.data ).to.deep.eq( data.field.data );
        } );
        it( 'should return error without author permlink', async () => {
            result = await WobjModel.addField();

            expect( result.error.message ).is.exist;
        } );
        it( 'should return error with not valid field', async () => {
            result = await WobjModel.addField( { author_permlink: permlink, field: getRandomString() } );

            expect( result.error.name ).to.deep.eq( 'ObjectParameterError' );
        } );

    } );
    describe( 'On increaseFieldWeight', async () => {
        let result, data, field;
        beforeEach( async () => {
            field = {
                author: getRandomString(),
                permlink: getRandomString(),
                weight: 0
            };
            data = {
                author: field.author,
                permlink: field.permlink,
                author_permlink: getRandomString(),
                weight: 1111
            };
            await ObjectFactory.Create( { appends: [ field ], author_permlink: data.author_permlink } );
        } );
        afterEach( async() => {
            await WObject.deleteOne( { author_permlink: data.author_permlink } );
        } );
        it( 'should success increase weight', async () => {
            result = await WobjModel.increaseFieldWeight( data );

            expect( result.result ).is.true;
        } );
        it( 'should success right increase weight', async () => {
            await WobjModel.increaseFieldWeight( data );
            result = await WObject.findOne( { author_permlink: data.author_permlink } );

            expect( data.weight ).to.deep.eq( result._doc.fields[ 0 ]._doc.weight );
        } );
        it( 'should get error without data', async () => {
            result = await WobjModel.increaseFieldWeight();

            expect( result.error ).is.exist;
        } );
        it( 'should return false if dont find object', async () => {
            result = await WobjModel.increaseFieldWeight( { author: getRandomString(),
                permlink: getRandomString(),
                author_permlink: getRandomString(),
                weight: 1111 } );
            expect( result.result ).is.false;
        } );
        it( 'should return error with not valid data', async () => {
            result = await WobjModel.increaseFieldWeight();

            expect( result.error ).is.exist;
        } );
        it( 'should return error without author permlink', async () => {
            result = await WobjModel.increaseFieldWeight( { author: getRandomString(),
                permlink: getRandomString(),
                weight: 1111 } );
            expect( result.error ).is.exist;
        } );
        it( 'should return error without author', async () => {
            result = await WobjModel.increaseFieldWeight( { author_permlink: getRandomString(),
                permlink: getRandomString(),
                weight: 1111 } );
            expect( result.error ).is.exist;
        } );
    } );
    describe( 'On increseWobjectWeight', async () => {
        let result, data, objType, objTypeName;
        beforeEach( async () => {
            objTypeName = getRandomString();
            data = {
                author_permlink: getRandomString(),
                weight: 100
            };
            await ObjectFactory.Create( { author_permlink: data.author_permlink, object_type: objTypeName } );
        } );
        it( 'should success increase wobject weight return true', async () => {
            result = await WobjModel.increaseWobjectWeight( data );
            expect( result.result ).is.true;
        } );
        it( 'should success increase wobject weight by data weight', async () => {
            await WobjModel.increaseWobjectWeight( data );
            result = await WObject.findOne( { author_permlink: data.author_permlink } );
            expect( result.weight ).to.deep.eq( data.weight );
        } );
        it( 'should seccess increase object type weight be data weight', async () => {
            await WobjModel.increaseWobjectWeight( data );
            result = await ObjectType.findOne( { name: objTypeName } );
            expect( result.weight ).to.deep.eq( data.weight );
        } );
        it( 'should eq wobject weight and wobject type weight', async () => {
            await WobjModel.increaseWobjectWeight( data );
            result = await WObject.findOne( { author_permlink: data.author_permlink } );
            objType = await ObjectType.findOne( { name: objTypeName } );
            expect( result.weight ).to.deep.eq( objType.weight );
        } );
        it( 'should return error without data', async () => {
            result = await WobjModel.increaseWobjectWeight();
            expect( result.error.message ).to.deep.eq( 'Data dont contains author permlink' );
        } );
        it( 'should return result false with incorrect data', async () => {
            result = await WobjModel.increaseWobjectWeight( { author_permlink: getRandomString(),
                weight: 100 } );
            expect( result.result ).is.false;
        } );
    } );
    describe( 'On remoteVote', async () => {
        let result, data, field, voter;
        beforeEach( async () => {
            voter = getRandomString();
            field = {
                author: getRandomString(),
                permlink: getRandomString(),
                weight: 0,
                active_votes:
                    [
                        {
                            voter: voter,
                            weight: 100
                        }
                    ]
            };
            data = {
                author: field.author,
                permlink: field.permlink,
                author_permlink: getRandomString(),
                weight: 1111,
                voter: voter
            };
            await ObjectFactory.Create( { appends: [ field ], author_permlink: data.author_permlink } );
        } );
        it( 'should success removeVote return true', async () => {
            result = await WobjModel.removeVote( data );
            expect( result.result ).is.true;
        } );
        it( 'should success remove Vote return false', async () => {
            result = await WobjModel.removeVote( { author: getRandomString(),
                permlink: field.permlink,
                author_permlink: getRandomString(),
                weight: 1111,
                voter: voter } );
            expect( result.result ).is.false;
        } );
        it( 'should success remove Vote ', async () => {
            await WobjModel.removeVote( data );
            result = await WObject.findOne( { author_permlink: data.author_permlink } );

            expect( result.fields[ 0 ].active_votes ).empty;
        } );
        it( 'shouldnt remove vote with not valid data', async () => {
            await WobjModel.removeVote( { author: getRandomString(),
                permlink: field.permlink,
                author_permlink: getRandomString(),
                weight: 1111,
                voter: voter } );
            result = await WObject.findOne( { author_permlink: data.author_permlink } );

            expect( result.fields[ 0 ].active_votes[ 0 ].voter ).to.deep.eq( voter );
        } );
        it( 'should return error with incorrect data', async () => {
            result = await WobjModel.removeVote();
            expect( result.error ).is.exist;
        } );
    } );
} );
