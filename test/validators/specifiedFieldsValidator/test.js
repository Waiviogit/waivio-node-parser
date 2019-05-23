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

    describe( 'on mapValidate', () => {
        it( 'should return true if all fields exist and correct type', () => {
            const mapMock = {
                longitude: 153,
                latitude: 85
            };
            const isValid = specifiedFieldsValidator.validateMap( mapMock );

            expect( isValid ).to.be.true;
        } );

        it( 'should return false if latitude not exist', () => {
            const mapMock = {
                longitude: 97
            };
            const isValid = specifiedFieldsValidator.validateMap( mapMock );

            expect( isValid ).to.be.false;
        } );

        it( 'should return false if longitude not exist', () => {
            const mapMock = {
                latitude: 97
            };
            const isValid = specifiedFieldsValidator.validateMap( mapMock );

            expect( isValid ).to.be.false;
        } );

        const longitudeTests = [
            { args: [ 100, 50 ], expected: true },
            { args: [ 190, 50 ], expected: false },
            { args: [ -100, 50 ], expected: true },
            { args: [ -190, 50 ], expected: false }
        ];

        longitudeTests.forEach( ( test ) => {
            it( `should return ${test.expected} with coordinates: ${test.args}`, () => {
                expect( specifiedFieldsValidator.validateMap( { longitude: test.args[ 0 ], latitude: test.args[ 1 ] } ) );
            } );
        } );

        const latitudeTests = [
            { args: [ 100, 50 ], expected: true },
            { args: [ 100, 95 ], expected: false },
            { args: [ 100, -50 ], expected: true },
            { args: [ 100, -97 ], expected: false }
        ];

        latitudeTests.forEach( ( test ) => {
            it( `should return ${test.expected} with coordinates: ${test.args}`, () => {
                expect( specifiedFieldsValidator.validateMap( { longitude: test.args[ 0 ], latitude: test.args[ 1 ] } ) );
            } );
        } );

    } );
} );
