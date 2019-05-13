const { getCreateObjectTypeMocks, getCreateObjectMocks } = require( './mocks' );
const { objectTypeParser, commentParser, createObjectParser, expect, sinon } = require( '../../testHelper' );

describe( 'comment parser', async () => {
    describe( 'when get operation with "parent_author"', async () => {
        describe( 'metadata include wobj with action', async () => {
            describe( 'createObjectType', async () => {
                let mockOp;
                let stub;

                before( async () => {
                    mockOp = await getCreateObjectTypeMocks();
                    stub = sinon.stub( objectTypeParser, 'parse' ).callsFake( async ( a, b ) => {
                        return {};
                    } );
                    await commentParser.parse( mockOp );
                } );
                after( () => {
                    stub.restore();
                } );

                it( 'should call objectTypeParser.parse once', () => {
                    expect( stub.calledOnce ).to.be.true;
                } );

                it( 'should call with correct first argument', async () => {
                    const firstArg = stub.getCall( 0 ).args[ 0 ];

                    expect( firstArg ).to.deep.equal( mockOp );
                } );

                it( 'should call with correct first argument', async () => {
                    const secondArg = stub.getCall( 0 ).args[ 1 ];
                    const expectedArg = JSON.parse( mockOp.json_metadata );

                    expect( secondArg ).to.deep.equal( expectedArg );
                } );
            } );
        } );
    } );

    describe( 'when get operation without "parent_author"', async () => {
        describe( 'metadata include wobj with action', async () => {
            describe( 'createObject', async () => {
                let mockOp;
                let stub;

                before( async () => {
                    mockOp = await getCreateObjectMocks();
                    stub = sinon.stub( createObjectParser, 'parse' ).callsFake( async ( a, b ) => {
                        return {};
                    } );
                    await commentParser.parse( mockOp );
                } );
                after( () => {
                    stub.restore();
                } );

                it( 'should call createObjectParser.parse once', () => {
                    expect( stub.calledOnce ).to.be.true;
                } );

                it( 'should call with correct first argument', async () => {
                    const firstArg = stub.getCall( 0 ).args[ 0 ];

                    expect( firstArg ).to.deep.equal( mockOp );
                } );

                it( 'should call with correct first argument', async () => {
                    const secondArg = stub.getCall( 0 ).args[ 1 ];
                    const expectedArg = JSON.parse( mockOp.json_metadata );

                    expect( secondArg ).to.deep.equal( expectedArg );
                } );
            } );
        } );
    } );
} );

