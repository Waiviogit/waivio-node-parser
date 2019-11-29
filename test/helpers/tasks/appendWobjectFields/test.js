const { WObject, expect, dropDatabase, sinon } = require( '../../../testHelper' );
const { ObjectFactory } = require( '../../../factories' );
const mocks = require( './mocks' );
const proxyquire = require( 'proxyquire' );
const _ = require( 'lodash' );
const fs = require( 'fs' );


describe( 'On appendWobjectFields', async () => {
    let wobject;
    beforeEach( async () => {
        await dropDatabase();
        wobject = await ObjectFactory.Create();
    } );
    afterEach( async () => {
        sinon.restore();
    } );
    describe( 'On valid input, one field', async () => {
        let wobjectOpsStub, mock;
        beforeEach( async () => {
            mock = mocks( { parent_permlink: wobject.author_permlink, parent_author: wobject.author } );
            wobjectOpsStub = proxyquire( '../../../../utilities/tasks/appendWobjectFields/wobjectsOperations',
                { './getComments': () => mock } );
        } );
        it( 'should successfully append field to wobject', async () => {
            await wobjectOpsStub.appendFields( );
            const result = await WObject.findOne( { author_permlink: wobject.author_permlink, author: wobject.author } );
            expect( result.fields.length > 0 ).to.true;
        } );
        it( 'should append correct field to wobject', async () => {
            await wobjectOpsStub.appendFields( wobject );
            const result = await WObject.findOne( { author_permlink: wobject.author_permlink, author: wobject.author } );
            expect( _.get( result.fields[ 0 ], [ 'locale', 'name', 'body' ] ) ).to.deep.eq(
                _.get( mock.result[ 0 ].metadata.wobj [ 'locale', 'name', 'body' ] )
            );
        } );
    } );
    describe( 'On valid input, many fields', async () => {
        let wobjectOpsStub, mock;
        beforeEach( async () => {
            mock = mocks( { parent_permlink: wobject.author_permlink, parent_author: wobject.author, count: 10 } );
            wobjectOpsStub = proxyquire( '../../../../utilities/tasks/appendWobjectFields/wobjectsOperations',
                { './getComments': () => mock } );
        } );
        it( 'should append correct quantity of fields', async () => {
            await wobjectOpsStub.appendFields( wobject );
            const result = await WObject.findOne( { author_permlink: wobject.author_permlink, author: wobject.author } );
            expect( result.fields.length === 10 ).to.true;
        } );
    } );
    describe( 'On invalid input', async () => {
        let wobjectOpsStub, mock;
        it( 'should write log to file if wobject have no fields in steem database', async () => {
            mock = mocks( { getError: true } );
            wobjectOpsStub = proxyquire( '../../../../utilities/tasks/appendWobjectFields/wobjectsOperations',
                { './getComments': () => mock } );
            sinon.spy( fs, 'appendFileSync' );
            await wobjectOpsStub.appendFields();
            expect( fs.appendFileSync.calledOnce ).to.true;
        } );
        it( 'should not append fields with incorrect data from steem api', async () => {
            mock = mocks( { parent_permlink: wobject.author_permlink, parent_author: wobject.author } );
            mock.result[ 0 ].metadata.wobj = {};
            wobjectOpsStub = proxyquire( '../../../../utilities/tasks/appendWobjectFields/wobjectsOperations',
                { './getComments': () => mock } );
            await wobjectOpsStub.appendFields();
            const result = await WObject.findOne( { author_permlink: wobject.author_permlink, author: wobject.author } );
            expect( result.fields.length === 0 ).to.true;
        } );
    } );
} );
