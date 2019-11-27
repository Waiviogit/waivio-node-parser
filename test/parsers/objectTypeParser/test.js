const { objectTypeParser, ObjectType, expect, redisGetter } = require( '../../testHelper' );
const { getMockData } = require( './mocks' );

describe( 'Object Type parser', async () => {
    describe( 'with valid data', async () => {
        let mockData;

        beforeEach( async () => {
            mockData = getMockData();
            await objectTypeParser.parse( mockData.operation, mockData.metadata );
        } );
        it( 'should create new ObjectType', async () => {
            const createdObjectType = await ObjectType.findOne( { name: mockData.metadata.wobj.name } ).lean();
            expect( createdObjectType ).to.not.be.undefined;
        } );

        describe( 'redis', async () => {
            let redisResult;

            beforeEach( async () => {
                redisResult = await redisGetter.getHashAll( `${mockData.operation.author }_${ mockData.operation.permlink}` );
            } );
            it( 'should exist redis reference on post', async () => {
                expect( redisResult ).to.exist;
            } );
            it( 'should have keys type and name', async () => {
                expect( redisResult ).to.include.all.keys( 'type', 'name' );
            } );
            it( 'should have type: "obj_type"', async () => {
                expect( redisResult.type ).to.equal( 'wobj_type' );
            } );
            it( 'should have correct name', async () => {
                expect( redisResult.name ).to.equal( mockData.metadata.wobj.name );
            } );
        } );
    } );
    describe( 'with invalid', async () => {
        // ///////////////
    } );
} );
