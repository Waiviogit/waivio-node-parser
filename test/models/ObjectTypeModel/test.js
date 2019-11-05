const { expect, ObjectTypeModel, ObjectType } = require( '../../testHelper' );
const { ObjectTypeFactory } = require( '../../factories' );

describe( 'ObjectTypeModel', async () => {
    describe( 'On getOne', async () => {
        let objectType2;
        before( async () => {
            objectType2 = await ObjectTypeFactory.Create( {
                name: 'second'
            } );
        } );
        it( 'should successful eq object types', async () => {
            const res = await ObjectTypeModel.getOne( { name: 'objectType.name' } );
            // const res2 = await ObjectTypeModel.getOne( { name: objectType2.name } );

            expect( res ).to.deep.eq( {
                'error': {
                    'message': 'Object Type not found!',
                    'status': 404
                }
            } );
        } );
        it( 'should return ', async () => {
            const res = await ObjectTypeModel.getOne( { name: 'second' } );

            expect( res.objectType ).to.deep.eq( objectType2._doc );
        } );
    } );
    describe( 'On create', async () => {
        let objectType;
        before( async () => {
            const res = await ObjectTypeModel.create( {
                name: 'author',
                author: 'name',
                permlink: 'database'
            } );
            objectType = res.objectType._doc;
        } );
        it( 'should successful create object in base', async () => {
            const res = await ObjectType.findOne( { name: 'author' } );

            expect( res ).not.empty;
        } );
        it( 'should successful equal names', async () => {
            const res = await ObjectType.findOne( { name: 'author' } );

            expect( objectType.permlink ).to.deep.eq( res.permlink );
        } );
        it( 'should equal id', async () => {
            const res = await ObjectType.findOne( { name: 'author' } );

            expect( objectType._id ).to.deep.eq( res._doc._id );
        } );
    } );
    describe( 'On getAll', async () => {
        let objectType, count;
        before( async () => {
            objectType = await ObjectTypeFactory.Create( {
                name: 'first'
            } );
            count = await ObjectType.countDocuments();
        } );
        it( 'should return array with length ', async () => {
            const types = await ObjectTypeModel.getAll();
            const typesArray = types.objectTypes;

            expect( typesArray.length ).to.deep.eq( count );
        } );
        it( 'should find objectType name', async () => {
            const types = await ObjectTypeModel.getAll();
            const typesArray = types.objectTypes;
            const objectTypeObj = objectType._doc;
            expect( typesArray[ count - 1 ].name ).to.deep.eq( objectTypeObj.name );
        } );
    } );
} );
