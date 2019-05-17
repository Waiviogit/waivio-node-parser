const { getMocksData } = require( './mocks' );
const { appendObjectParser, WObject, expect, redisGetter, updateSpecifiedFieldsHelper, sinon } = require( '../../testHelper' );

describe( 'Append object parser,', async () => {
    let mockData;
    let wobject;
    let updateSpecifiedFieldHelperStub;

    before( async () => {
        updateSpecifiedFieldHelperStub = sinon.stub( updateSpecifiedFieldsHelper, 'update' ).callsFake( () => {} );
        mockData = await getMocksData();
        await appendObjectParser.parse( mockData.operation, mockData.metadata );
        wobject = await WObject.findOne( { author_permlink: mockData.wobject.author_permlink } ).lean();
    } );

    after( () => {
        updateSpecifiedFieldHelperStub.restore();
    } );

    it( 'should call "updateSpecifiedFields" once', () => {
        expect( updateSpecifiedFieldHelperStub.calledOnce ).to.be.true;
    } );

    it( 'should call "updateSpecifiedFieldHelper" with correct params', () => {
        expect( updateSpecifiedFieldHelperStub.args[ 0 ][ 0 ] ).to.equal( mockData.operation.author );
        expect( updateSpecifiedFieldHelperStub.args[ 0 ][ 1 ] ).to.equal( mockData.operation.permlink );
        expect( updateSpecifiedFieldHelperStub.args[ 0 ][ 2 ] ).to.equal( mockData.operation.parent_permlink );
    } );


    describe( 'field', async () => {
        it( 'should exist', async () => {
            const field = wobject.fields.find( ( f ) => f.author === mockData.operation.author && f.permlink === mockData.operation.permlink );

            expect( field ).to.exist;
        } );
        it( 'should have weight 1', async () => {
            const field = wobject.fields.find( ( f ) => f.author === mockData.operation.author && f.permlink === mockData.operation.permlink );

            expect( field.weight ).to.equal( 1 );
        } );
        it( 'should have keys name,body,weight,locale,author,creator,permlink', async () => {
            const field = wobject.fields.find( ( f ) => f.author === mockData.operation.author && f.permlink === mockData.operation.permlink );

            expect( field ).to.include.all.keys( 'name', 'body', 'weight', 'locale', 'author', 'creator', 'permlink' );
        } );
    } );
    describe( 'redis', async () => {
        let redisResponse;

        before( async () => {
            redisResponse = await redisGetter.getHashAll( `${mockData.operation.author }_${ mockData.operation.permlink}` );
        } );
        it( 'should include ref on comment with create object', async () => {
            expect( redisResponse ).to.exist;
        } );
        it( 'should have keys type,root_wobj', async () => {
            expect( redisResponse ).to.include.all.keys( 'type', 'root_wobj' );
        } );
        it( 'should have type:"append_wobj"', async () => {
            expect( redisResponse.type ).to.equal( 'append_wobj' );
        } );
        it( 'should have correct "root_wobj" reference', async () => {
            expect( redisResponse.root_wobj ).to.equal( wobject.author_permlink );
        } );
    } );

} );
