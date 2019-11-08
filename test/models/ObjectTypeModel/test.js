const { expect, ObjectTypeModel, ObjectType, getRandomString, Mongoose } = require( '../../testHelper' );
const { ObjectTypeFactory } = require( '../../factories' );
const _ = require( 'lodash' );


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
            result = await ObjectType.findOne( { name: object.objectType.name } );
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
        let rnd, name;
        beforeEach( async () => {
            await Mongoose.connection.dropDatabase();
            name = getRandomString();
            await ObjectTypeFactory.Create( { name: name } );
            rnd = _.random( 5, 10, false );
            for ( let tmp = 0; tmp < rnd; tmp++ ) {
                await ObjectTypeFactory.Create( {
                    name: getRandomString()
                } );
            }
        } );
        it( 'should return array with length ', async () => {
            const types = await ObjectTypeModel.getAll();
            expect( types.objectTypes.length ).to.deep.eq( rnd + 1 );
        } );
        it( 'should find objectType name', async () => {
            const types = await ObjectTypeModel.getAll();
            expect( types.objectTypes[ 0 ].name ).to.deep.eq( name );
        } );
    } );
} );
