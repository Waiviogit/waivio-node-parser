const { expect, getRandomString } = require( '../../testHelper' );
const { wobjectValidator } = require( '../../../validator' );

describe( 'wobjectValidator', async () => {
    describe( 'on validateRatingVote ', async () => {
        let requiredFieldsRatingVote = 'author,permlink,author_permlink,rate'.split( ',' );
        let validData = {};
        before( async () => {
            requiredFieldsRatingVote.forEach( ( f ) => {
                validData[ f ] = getRandomString( 10 );
            } );
        } );

        it( 'should return true if all required field exist', () => {
            const res = wobjectValidator.validateRatingVote( validData );
            expect( res ).to.be.true;
        } );
        requiredFieldsRatingVote.forEach( ( field ) => {
            it( `without field ${field} should return false`, () => {
                const data = { ...validData };
                delete data[ field ];
                expect( wobjectValidator.validateRatingVote( data ) ).to.be.false;
            } );
        } );
    } );

    describe( 'on validateObjectType ', async () => {
        let requiredFieldsRatingVote = 'author,permlink,name'.split( ',' );
        let validData = {};
        before( async () => {
            requiredFieldsRatingVote.forEach( ( f ) => {
                validData[ f ] = getRandomString( 10 );
            } );
        } );

        it( 'should return true if all required field exist', () => {
            const res = wobjectValidator.validateObjectType( validData );
            expect( res ).to.be.true;
        } );
        requiredFieldsRatingVote.forEach( ( field ) => {
            it( `without field ${field} should return false`, () => {
                const data = { ...validData };
                delete data[ field ];
                expect( wobjectValidator.validateObjectType( data ) ).to.be.false;
            } );
        } );
    } );
} );
