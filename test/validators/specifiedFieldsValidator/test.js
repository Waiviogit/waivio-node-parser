const { expect, specifiedFieldsValidator } = require( '../../testHelper' );

describe( 'Specified Fields Validator', () => {
    describe( 'on newsFilterValidate', () => {
        it( 'should return true if all fields exist and correct type', () => {
            const newsFilterMock = {
                allowList: [ [ 'a', 'b' ], [ 'c', 'd' ] ],
                ignoreList: [ 'e', 'f' ]
            };
            const isValid = specifiedFieldsValidator.validateNewsFilter( newsFilterMock );

            expect( isValid ).to.be.true;
        } );

        it( 'should return false if allowList not exist', () => {
            const newsFilterMock = {
                ignoreList: [ 'e', 'f' ]
            };
            const isValid = specifiedFieldsValidator.validateNewsFilter( newsFilterMock );

            expect( isValid ).to.be.false;
        } );

        it( 'should return false if allowList include not arrays', () => {
            const newsFilterMock = {
                allowList: [ [ 'a', 'b' ], [ 'c', 'd' ], 'a' ],
                ignoreList: [ 'e', 'f' ]
            };
            const isValid = specifiedFieldsValidator.validateNewsFilter( newsFilterMock );

            expect( isValid ).to.be.false;
        } );

        it( 'should return false if ignoreList not exist', () => {
            const newsFilterMock = {
                allowList: [ [ 'a', 'b' ], [ 'c', 'd' ], 'a' ]
            };
            const isValid = specifiedFieldsValidator.validateNewsFilter( newsFilterMock );

            expect( isValid ).to.be.false;
        } );

        it( 'should return false if ignoreList is not array', () => {
            const newsFilterMock = {
                allowList: [ [ 'a', 'b' ], [ 'c', 'd' ], 'a' ],
                ignoreList: 'abc'
            };
            const isValid = specifiedFieldsValidator.validateNewsFilter( newsFilterMock );

            expect( isValid ).to.be.false;
        } );
    } );
} );
