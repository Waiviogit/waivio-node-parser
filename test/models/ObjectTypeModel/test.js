const { expect, ObjectTypeModel, ObjectType, faker, dropDatabase } = require( '../../testHelper' );
const { ObjectTypeFactory } = require( '../../factories' );
const _ = require( 'lodash' );


describe( 'ObjectTypeModel', async () => {
    describe( 'On getOne', async () => {
        let objectType;
        beforeEach( async () => {
            objectType = await ObjectTypeFactory.Create( );
        } );
        it( 'should return error', async () => {
            const res = await ObjectTypeModel.getOne( { name: faker.random.string() } );
            expect( res.error ).is.exist;
        } );

        it( 'should not found Object type', async () => {
            const res = await ObjectTypeModel.getOne( { name: faker.random.string() } );
            expect( res ).to.deep.eq( {
                'error': {
                    'message': 'Object Type not found!',
                    'status': 404
                }
            } );
        } );
        it( 'should return objectType on valid input data ', async () => {
            const res = await ObjectTypeModel.getOne( { name: objectType.name } );
            expect( res.objectType ).is.exist;
        } );
        it( 'should check objectTypes for identity', async () => {
            const res = await ObjectTypeModel.getOne( { name: objectType.name } );
            expect( res.objectType ).to.deep.eq( objectType );
        } );
    } );
    describe( 'On create', async () => {
        let objectType;
        beforeEach( async () => {
            objectType = await ObjectTypeModel.create( { name: faker.random.string(), author: faker.random.string(),
                author_permlink: faker.random.string()
            } );
        } );
        it( 'should return objectType with correct permlink', async () => {
            const result = await ObjectType.findOne( { name: objectType.objectType.name } );

            expect( objectType.objectType.permlink ).to.eq( result.permlink );
        } );
        it( 'should check created id and found for identity', async () => {
            const result = await ObjectType.findOne( { name: objectType.objectType.name } );
            expect( objectType.objectType._id ).to.deep.eq( result._id );
        } );
        it( 'should return error with incorrect params', async () => {
            objectType = await ObjectTypeModel.create( { name: { some: faker.random.string() }, author: faker.random.string(),
                author_permlink: faker.random.string() } );
            expect( objectType.error ).is.exist;
        } );
        it( 'should return Validation error', async () => {
            objectType = await ObjectTypeModel.create( { name: { some: faker.random.string() }, author: faker.random.string(),
                author_permlink: faker.random.string() } );
            expect( objectType.error.name ).to.eq( 'ValidationError' );
        } );
    } );
    describe( 'On getAll', async () => {
        let objTypesCount;
        beforeEach( async () => {
            await dropDatabase();
            objTypesCount = _.random( 5, 10, false );
            for ( let tmp = 0; tmp < objTypesCount; tmp++ ) {
                await ObjectTypeFactory.Create( );
            }
        } );
        it( 'should return array with correct length ', async () => {
            const types = await ObjectTypeModel.getAll();
            expect( types.objectTypes.length ).to.eq( objTypesCount );
        } );
    } );
} );
