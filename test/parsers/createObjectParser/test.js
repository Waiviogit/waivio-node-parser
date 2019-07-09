const { getMocksData } = require( './mocks' );
const { createObjectParser, WObject, expect, redisGetter, User, UserWobjects } = require( '../../testHelper' );

describe( 'Object parser', async () => {
    describe( 'when parse valid data', async () => {
        let mockData;
        let wobject;

        before( async () => {
            mockData = await getMocksData();
            await createObjectParser.parse( mockData.operation, mockData.metadata );
            wobject = await WObject.findOne( { author_permlink: mockData.operation.permlink } ).lean();
        } );
        describe( 'wobject', async () => {
            it( 'should creating in database', async () => {
                expect( wobject ).to.exist;
            } );
            it( 'should have object_type as in parent post with CreateObjectType', async () => {
                expect( wobject.object_type ).to.equal( mockData.objectType.name );
            } );
        } );
        describe( 'redis result', async () => {
            let redisResult;

            before( async () => {
                redisResult = await redisGetter.getHashAll( `${wobject.author }_${ wobject.author_permlink}` );
            } );
            it( 'should exist', async () => {
                expect( redisResult ).to.exist;
            } );
            it( 'should have keys root_wobj and type', async () => {
                expect( redisResult ).to.have.all.keys( 'root_wobj', 'type' );
            } );
            it( 'should have type: "create_wobj"', async () => {
                expect( redisResult.type ).to.be.equal( 'create_wobj' );
            } );
            it( 'should have correct "root_wobj"', async () => {
                expect( redisResult.root_wobj ).to.be.equal( wobject.author_permlink );
            } );
        } );
        describe( 'creator(user)', async () => {
            let creator;

            before( async () => {
                creator = await User.findOne( { name: mockData.metadata.wobj.creator } );
            } );
            it( 'should exist', async () => {
                expect( creator ).to.exist;
            } );
            it( 'should have field "wobjects_weight"', () => {
                expect( creator.wobjects_weight ).to.exist;
            } );
            it( 'should have "wobjects_weight" with value 1', () => {
                expect( creator.wobjects_weight ).to.be.eq( 1 );
            } );
            it( 'should have weight in wobject', async () => {
                const wobjWeight = await UserWobjects.findOne( { user_name: mockData.metadata.wobj.creator, author_permlink: wobject.author_permlink } ).lean();

                expect( wobjWeight ).to.exist;
            } );
            it( 'should have weight 1 in wobject', async () => {
                const wobjWeight = await UserWobjects.findOne( { user_name: mockData.metadata.wobj.creator, author_permlink: wobject.author_permlink } ).lean();

                expect( wobjWeight.weight ).to.equal( 1 );
            } );

        } );
    } );
} );
