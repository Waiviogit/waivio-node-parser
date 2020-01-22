const { expect, sinon, importUpdates, wobjectHelper, faker, ObjectTypeModel } = require( '../../testHelper' );
const { ObjectTypeFactory, ObjectFactory } = require( '../../factories' );

describe( 'addSupposedUpdates', async () => {
    describe( 'on valid input', async () => {
        let objectType, wobject, importUpdatesStub, supposedUpdatesMock;
        beforeEach( async () => {
            supposedUpdatesMock = [ {
                name: faker.address.city(),
                values: [ faker.random.string( 10 ) ],
                id_path: faker.random.string( 5 )
            } ];
            objectType = await ObjectTypeFactory.Create( { supposed_updates: supposedUpdatesMock } );
            wobject = await ObjectFactory.Create( { object_type: objectType.name } );
            importUpdatesStub = sinon.stub( importUpdates, 'send' ).callsFake( () => {} );
            await wobjectHelper.addSupposedUpdates( wobject );
        } );
        afterEach( () => importUpdatesStub.restore() );

        it( 'should call importUpdates.send once', () => {
            expect( importUpdatesStub ).to.be.calledOnce;
        } );
        it( 'should call importUpdates.send with array param', () => {
            const call = importUpdatesStub.getCall( 0 );
            expect( Array.isArray( call.args[ 0 ] ) ).to.be.true;
        } );
        it( 'should call importUpdates.send with keys author_permlink, object_type and fields', () => {
            const call = importUpdatesStub.getCall( 0 );
            expect( call.args[ 0 ][ 0 ] ).to.have.keys( [ 'author_permlink', 'object_type', 'fields' ] );
        } );
        it( 'should call importUpdates.send with correct field keys', () => {
            const call = importUpdatesStub.getCall( 0 );
            expect( call.args[ 0 ][ 0 ].fields[ 0 ] ).to.have.keys( [ 'name', 'body', 'permlink', 'creator', supposedUpdatesMock[ 0 ].id_path ] );
        } );
    } );

    describe( 'on empty supposed_fields', async () => {
        let objectType, wobject, importUpdatesStub;
        beforeEach( async () => {
            objectType = await ObjectTypeFactory.Create( );
            wobject = await ObjectFactory.Create( { object_type: objectType.name } );
            importUpdatesStub = sinon.stub( importUpdates, 'send' ).callsFake( () => {} );
            await wobjectHelper.addSupposedUpdates( wobject );
        } );
        afterEach( () => importUpdatesStub.restore() );

        it( 'should not call importUpdates.send', () => {
            expect( importUpdatesStub ).to.be.not.called;
        } );
    } );

    describe( 'on ObjectType model returning error', async () => {
        let objectType, wobject, importUpdatesStub, ObjectTypeStub;
        beforeEach( async () => {
            objectType = await ObjectTypeFactory.Create( );
            wobject = await ObjectFactory.Create( { object_type: objectType.name } );
            ObjectTypeStub = sinon.stub( ObjectTypeModel, 'getOne' ).callsFake( () => {
                return { error: { message: 'Test error' } };
            } );
            importUpdatesStub = sinon.stub( importUpdates, 'send' ).callsFake( () => {} );
            await wobjectHelper.addSupposedUpdates( wobject );
        } );
        afterEach( () => {
            importUpdatesStub.restore();
            ObjectTypeStub.restore();
        } );

        it( 'should not call importUpdates.send', () => {
            expect( importUpdatesStub ).to.be.not.called;
        } );
    } );

} );
