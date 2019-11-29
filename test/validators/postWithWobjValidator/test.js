const { expect, getRandomString } = require( '../../testHelper' );
const { postWithWobjValidator } = require( '../../../validator' );

describe( 'On postWIthWobjValidator', async () => {
    describe( 'on validate method', async () => {
        describe( 'on valid input', async () => {
            let mockWobjects;
            beforeEach( () => {
                mockWobjects = [];
            } );
            it( 'should return true if sum of wobject percents is 100', () => {
                for( let i = 0; i < 4;i++ ) {
                    mockWobjects.push( { author_permlink: getRandomString( 15 ), percent: 25 } );
                }
                expect( postWithWobjValidator.validate( { wobjects: mockWobjects } ) ).to.be.true;
            } );
            it( 'should return true if sum of wobject percents is between 0 and 100', () => {
                for( let i = 0; i < 4;i++ ) {
                    mockWobjects.push( { author_permlink: getRandomString( 15 ), percent: 15 } );
                }
                expect( postWithWobjValidator.validate( { wobjects: mockWobjects } ) ).to.be.true;
            } );
        } );
        describe( 'on invalid input', async () => {
            let mockWobjects;
            beforeEach( () => {
                mockWobjects = [];
            } );
            it( 'should return false if sum of wobject percents greater than 100 by 1', () => {
                for( let i = 0; i < 4;i++ ) {
                    mockWobjects.push( { author_permlink: getRandomString( 15 ), percent: 25 } );
                }
                mockWobjects[ 0 ].percent++;
                expect( postWithWobjValidator.validate( { wobjects: mockWobjects } ) ).to.be.false;
            } );
            it( 'should return false if sum of wobject percents equal 0', () => {
                for( let i = 0; i < 4;i++ ) {
                    mockWobjects.push( { author_permlink: getRandomString( 15 ), percent: 0 } );
                }
                expect( postWithWobjValidator.validate( { wobjects: mockWobjects } ) ).to.be.false;
            } );
            it( 'should return false if sum of wobject percents less then 0', () => {
                for( let i = 0; i < 4;i++ ) {
                    mockWobjects.push( { author_permlink: getRandomString( 15 ), percent: -1 } );
                }
                expect( postWithWobjValidator.validate( { wobjects: mockWobjects } ) ).to.be.false;
            } );
        } );

    } );
} );
