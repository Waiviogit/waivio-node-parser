const { expect, faker, sinon } = require( '../../testHelper' );
const { validateProxyBot } = require( '../../../utilities/guestOperations/guestHelpers' );
const constants = require( '../../../utilities/constants' );

describe( 'guestHelpers', async () => {
    describe( 'on validateProxyBot', async () => {
        let mockListBots;
        beforeEach( async () => {
            mockListBots = [ faker.name.firstName(), faker.name.firstName() ];
            sinon.stub( constants, 'WAIVIO_PROXY_BOTS' ).value( mockListBots );
        } );
        afterEach( () => {
            sinon.restore();
        } );
        it( 'should return true if user in list proxy bots', () => {
            expect( validateProxyBot( mockListBots[ 0 ] ) ).to.be.true;
        } );
        it( 'should return false if user not in list proxy bots', () => {
            expect( validateProxyBot( faker.name.firstName() ) ).to.be.false;
        } );
        it( 'should return false if called without params', () => {
            expect( validateProxyBot( ) ).to.be.false;
        } );
    } );

} );

