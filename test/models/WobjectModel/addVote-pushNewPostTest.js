const { expect, WobjModel, getRandomString, Mongoose } = require( '../../testHelper' );
const WObjectModel = require( '../../../database' ).models.WObject;
const { ObjectFactory } = require( '../../factories' );
const _ = require( 'lodash' );
/*
Tests for some methods of WobjectModel:
  addVote,
    getWobjectsRefs,
    getFieldsRefs,
    getSomeFields,
    getField,
    updateField,
    pushNewPost
 */

describe( 'Wobject model', async () => {
    describe( 'On addVote', async () => {
        let result, data, field, voter;
        beforeEach( async () => {
            voter = getRandomString();
            field = {
                author: getRandomString(),
                permlink: getRandomString(),
                weight: 0,
                active_votes:
                    []
            };
            data = {
                author: field.author,
                permlink: field.permlink,
                author_permlink: getRandomString(),
                weight: 1111,
                vote: {
                    voter: voter,
                    weight: 100
                }
            };
            await ObjectFactory.Create( { appends: [ field ], author_permlink: data.author_permlink } );
        } );
        it( 'should success addVote return true', async () => {
            result = await WobjModel.addVote( data );
            expect( result.result ).is.true;
        } );
        it( 'should success addVote return false', async () => {
            result = await WobjModel.addVote( { author: getRandomString(),
                permlink: getRandomString(),
                author_permlink: getRandomString(),
                weight: 1111,
                vote: {
                    voter: voter,
                    weight: 100
                } } );
            expect( result.result ).is.false;
        } );
        it( 'should success add vote', async () => {
            await WobjModel.addVote( data );
            result = await WObjectModel.findOne( { author_permlink: data.author_permlink } );
            expect( result.fields[ 0 ].active_votes[ 0 ].voter ).to.deep.eq( data.vote.voter );
        } );
        it( 'should return error with incorrect data', async () => {
            result = await WobjModel.addVote();
            expect( result.error ).is.exist;
        } );
        it( 'should return eq error message', async () => {
            result = await WobjModel.addVote( { author: getRandomString(),
                author_permlink: { data: getRandomString() },
                permlink: getRandomString(),
                weight: 1111 } );
            expect( result.error.name ).to.deep.eq( 'CastError' );
        } );
    } );
    describe( 'On getWobjectsRefs', async () => {
        let result, rnd;
        beforeEach( async () => {
            await Mongoose.connection.dropDatabase();
            rnd = _.random( 5, 10, false );
            for ( let i = 0; i < rnd; i++ ) {
                await ObjectFactory.Create();
            }
        } );
        it( 'should eq array length', async () => {
            result = await WobjModel.getWobjectsRefs();
            expect( result.wobjects.length ).to.deep.eq( rnd );
        } );
        it( 'should eq arrays', async () => {
            result = await WobjModel.getWobjectsRefs();
            let findAll = await WObjectModel.find();
            let mappedDB = { wobjects: _.map( findAll, ( obj ) => {
                return{
                    author_permlink: obj.author_permlink,
                    author: obj.author
                };
            } ) };
            expect( result ).to.deep.eq( mappedDB );
        } );
    } );
    describe( 'On getFieldsRefs', async () => {
        let result, rnd, wobject, data, permlink;
        beforeEach( async () => {
            permlink = getRandomString();

            await Mongoose.connection.dropDatabase();
            rnd = _.random( 5, 10, false );
            await ObjectFactory.Create( { author_permlink: permlink } );
            for ( let i = 0; i < rnd; i++ ) {
                data = {
                    author_permlink: permlink,
                    field: {
                        author: getRandomString(),
                        permlink: getRandomString()
                    }
                };
                await WobjModel.addField( data );
            }
        } );
        it( 'should fields eq', async () => {
            result = await WobjModel.getFieldsRefs( permlink );
            let temp = await WObjectModel.findOne( { author_permlink: data.author_permlink } );
            wobject = _.map( temp.fields, ( obj ) => {
                return {
                    field_author: obj.author,
                    field_permlink: obj.permlink
                };
            } );
            expect( result.fields ).to.deep.eq( wobject );
        } );
        it( 'should return null with incorrect permlink', async () => {
            result = await WobjModel.getFieldsRefs( getRandomString() );
            expect( result.fields.length === 0 ).is.true;
        } );
        it( 'should return error with not valid data', async () => {
            result = await WobjModel.getFieldsRefs();
            expect( result.error ).is.not.exist;
        } );
    } );
    describe( 'On getSomeFields', async () => {
        let result, data, temp, author, permlink;
        beforeEach( async () => {
            await Mongoose.connection.dropDatabase();
            permlink = getRandomString();
            author = getRandomString();
            await ObjectFactory.Create( { author_permlink: permlink } );
            await ObjectFactory.Create( { author_permlink: 'permlink' } );
            data = {
                author_permlink: permlink,
                field: {
                    name: author,
                    author: getRandomString(),
                    permlink: getRandomString()
                }
            };

            await WobjModel.addField( data );
            await WobjModel.addField( { author_permlink: 'permlink',
                field: {
                    name: 'author',
                    author: getRandomString(),
                    permlink: getRandomString()
                } } );

        } );
        it( 'should ', async () => {
            let res = await WObjectModel.findOne( { author_permlink: permlink } );
            result = await WobjModel.getSomeFields(author,permlink);
            expect( result ).is.exist;
        } );
    } );
    describe( 'On getField', async () => {
        let result, data, field;
        beforeEach( async () => {
            field = {
                author: getRandomString(),
                permlink: getRandomString(),
                weight: 0
            };
            data = {
                author: field.author,
                permlink: field.permlink,
                author_permlink: getRandomString()
            };
            await ObjectFactory.Create( { appends: [ field ], author_permlink: data.author_permlink } );
        } );
        afterEach( async() => {
            await WObjectModel.deleteOne( { author_permlink: data.author_permlink } );
        } );
        it( 'should ', async () => {
            result = await WobjModel.getField( data.author, data.permlink, data.author_permlink );

            expect( result ).is.exist;
        } );
    } );
    describe( 'On updateField', async () => {

    } );
    describe( 'On pushNewPost', async () => {

    } );
} );
