const { expect, getRandomString, faker } = require( '../../testHelper' );
const { wobjectValidator } = require( '../../../validator' );
const { BLACK_LIST_BOTS } = require( '../../../utilities/constants' );

describe( 'wobjectValidator', async () => {
    describe( 'on validateRatingVote ', async () => {
        let requiredFieldsRatingVote = 'author,permlink,author_permlink,rate'.split( ',' );
        let validData = {};
        beforeEach( async () => {
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
        beforeEach( async () => {
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
        it( 'should return false if author in blacklist', () => {
            validData.author = BLACK_LIST_BOTS[ faker.random.number( BLACK_LIST_BOTS.length - 1 ) ];
            expect( wobjectValidator.validateObjectType( validData ) ).to.be.false;
        } );
    } );
} );
