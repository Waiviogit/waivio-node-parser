const { expect, ObjectTypeModel, ObjectType, getRandomString } = require( '../../testHelper' );
const { ObjectTypeFactory } = require( '../../factories' );

describe( 'ObjectTypeModel', async () => {
    describe( 'On getOne', async () => {
        let objectType2, name;
        before( async () => {
            name = getRandomString();
            objectType2 = await ObjectTypeFactory.Create( {
                name: name
            } );
        } );
        it( 'should success return error', async () => {
            const res = await ObjectTypeModel.getOne( { name: getRandomString() } );
            expect( res.error ).is.exist;
        } );
       
        it( 'should successful eq object types', async () => {
            const res = await ObjectTypeModel.getOne( { name: getRandomString() } );
            expect( res ).to.deep.eq( {
                'error': {
                    'message': 'Object Type not found!',
                    'status': 404
                }
            } );
        } );
        it( 'should success getOne ', async () => {
            const res = await ObjectTypeModel.getOne( { name: name } );

            expect( res.objectType ).is.exist;
        } );
        it( 'should success getOne object type', async () => {
            const res = await ObjectTypeModel.getOne( { name: name } );

            expect( res.objectType ).to.deep.eq( objectType2._doc );
        } );
    } );
    describe( 'On create', async () => {
        let object, result;
        beforeEach( async () => {
            object = await ObjectTypeModel.create( { name: getRandomString(), author: getRandomString(),
                author_permlink: getRandomString()
            } );
        } );
        it( 'should successful create object in base', async () => {
            result = await ObjectType.findOne( { name: object.objectType.name } );
            expect( result ).not.empty;
        } );
        it( 'should successful equal permlink', async () => {
            result = await ObjectType.findOne( { name: object.objectType.name } );

            expect( object.objectType.permlink ).to.deep.eq( result.permlink );
        } );
        it( 'should equal id', async () => {
            result = await ObjectType.findOne( { name: objectType.name } );
            expect( object.objectType._id ).to.deep.eq( result._id );
        } );
        it( 'should success return error', async () => {
            object = await ObjectTypeModel.create( { name: { some: getRandomString() }, author: getRandomString(),
                author_permlink: getRandomString() } );
            expect( object.error ).is.exist;
        } );
        it( 'should success return Validation error', async () => {
            object = await ObjectTypeModel.create( { name: { some: getRandomString() }, author: getRandomString(),
                author_permlink: getRandomString() } );
            expect( object.error.name ).to.deep.eq( 'ValidationError' );
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
