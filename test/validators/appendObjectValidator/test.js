const { expect, faker, getRandomString, ObjectType, WObject } = require( '../../testHelper' );
const { appendObjectValidator } = require( '../../../validator' );
const { ObjectFactory, AppendObject } = require( '../../factories' );
const { BLACK_LIST_BOTS } = require( '../../../utilities/constants' );


describe( 'appendObjectValidator', async () => {
    let wobject, mockData, mockOp;

    beforeEach( async () => {
        wobject = await ObjectFactory.Create();
        mockData = {
            author_permlink: wobject.author_permlink,
            field: {
                name: getRandomString(),
                body: getRandomString(),
                locale: 'en-US',
                creator: faker.name.firstName().toLowerCase(),
                author: faker.name.firstName().toLowerCase(),
                permlink: getRandomString( 15 )
            }
        };
        mockOp = {
            parent_author: wobject.author,
            parent_permlink: wobject.author_permlink,
            author: getRandomString(),
            permlink: getRandomString()
        };
    } );

    describe( 'on valid input', async () => {
        it( 'should not throw error if all fields is exist', async () => {
            await expect( appendObjectValidator.validate( mockData, mockOp ) ).to.not.be.rejected;
        } );
    } );

    describe( 'validate the same fields', async () => {
        let newWobj;
        beforeEach( async () => {
            newWobj = await ObjectFactory.Create( { appends: [ mockData.field ] } );
        } );
        describe( 'on valid input', async () => {
            it( 'should not throw error with the same field in another locale', async () => {
                mockData.field.locale = 'ru-RU';
                mockData.author_permlink = newWobj.author_permlink;
                await expect( appendObjectValidator.validate( mockData, mockOp ) ).to.not.be.rejected;
            } );
            it( 'should not throw error if body of added field is different', async () => {
                mockData.field.body = getRandomString( 20 );
                mockData.author_permlink = newWobj.author_permlink;
                await expect( appendObjectValidator.validate( mockData, mockOp ) ).to.not.be.rejected;
            } );
        } );
        describe( 'on invalid input', async () => {
            it( 'should throw error with the same field ', async () => {
                mockData.author_permlink = newWobj.author_permlink;
                await expect( appendObjectValidator.validate( mockData, mockOp ) ).to.be.rejected;
            } );
            it( 'should rejected with error message if added the same field', async () => {
                mockData.author_permlink = newWobj.author_permlink;
                await expect( appendObjectValidator.validate( mockData, mockOp ) )
                    .to.be.rejectedWith( Error, "Can't append object, the same field already exists" );
            } );
        } );
    } );
    describe( 'on invalid input', async () => {

        describe( 'when data do not contain all keys', async () => {
            let requiredKeys = 'name,body,locale,author,permlink,creator'.split( ',' );

            for ( const key of requiredKeys ) {
                it( `should be rejected without ${key}`, async () => {
                    delete mockData.field[ key ];
                    await expect( appendObjectValidator.validate( mockData, mockOp ) ).to.be.rejected;
                } );
            }
            for( const key of requiredKeys ) {
                it( `should be rejected without ${key} with correct message`, async () => {
                    delete mockData.field[ key ];
                    await expect( appendObjectValidator.validate( mockData, mockOp ) )
                        .to.be.rejectedWith( Error, "Can't append object, not all required fields is filling!" );
                } );
            }
        } );

        describe( 'when parent comment is not createobject comment', async () => {
            it( 'should be rejected if parent_author wrong', async () => {
                mockOp.parent_author = getRandomString( 10 );
                await expect( appendObjectValidator.validate( mockData, mockOp ) ).to.be.rejected;
            } );
            it( 'should be rejected if parent_author wrong with corr. message', async () => {
                mockOp.parent_author = getRandomString( 10 );
                await expect( appendObjectValidator.validate( mockData, mockOp ) )
                    .to.be.rejectedWith( Error, "Can't append object, parent comment isn't create Object comment!" );
            } );
            it( 'should be rejected if parent_permlink wrong', async () => {
                mockOp.parent_permlink = getRandomString( 10 );
                await expect( appendObjectValidator.validate( mockData, mockOp ) ).to.be.rejected;
            } );
            it( 'should be rejected if parent_permlink wrong with corr. message', async () => {
                mockOp.parent_author = getRandomString( 10 );
                await expect( appendObjectValidator.validate( mockData, mockOp ) )
                    .to.be.rejectedWith( Error, "Can't append object, parent comment isn't create Object comment!" );
            } );
        } );

        describe( 'when try to add already existing append', async () => {
            let existAppend;
            beforeEach( async () => {
                let { appendObject } = await AppendObject.Create();
                existAppend = appendObject;
            } );
            it( 'should be rejected if append with the same author and permlink already exists', async () => {
                mockOp.author = existAppend.author;
                mockOp.permlink = existAppend.permlink;
                await expect( appendObjectValidator.validate( mockData, mockOp ) ).to.be.rejected;
            } );
            it( 'should be rejected with corr. message if append with the same author and permlink already exists', async () => {
                mockOp.author = existAppend.author;
                mockOp.permlink = existAppend.permlink;
                await expect( appendObjectValidator.validate( mockData, mockOp ) )
                    .to.be.rejectedWith( Error, "Can't append object, append is now exist!" );
            } );
        } );

        describe( 'when field in black list for current ObjectType', async () => {
            let blackListFieldName;
            beforeEach( async () => {
                blackListFieldName = getRandomString();

                const objectType = await ObjectType.findOne( { name: wobject.object_type } );
                objectType.updates_blacklist = [ blackListFieldName ];
                await objectType.save();
                mockData.field.name = blackListFieldName;
            } );
            it( 'should be rejected with Error', async () => {
                await expect( appendObjectValidator.validate( mockData, mockOp ) ).to.be.rejected;
            } );
            it( 'should be rejected with message about blacklist', async () => {
                await expect( appendObjectValidator.validate( mockData, mockOp ) )
                    .to.be.rejectedWith( Error, `Can't append object, field ${blackListFieldName} in black list for object type ${wobject.object_type}!` );
            } );
        } );

        describe( 'when wobject not exist', async () => {
            it( 'should be rejected', async () => {
                await WObject.deleteOne( { author_permlink: wobject.author_permlink } );
                await expect( appendObjectValidator.validate( mockData, mockOp ) ).to.be.rejected;
            } );
        } );

        describe( 'when object type not exist', async () => {
            it( 'should be rejected', async () => {
                await ObjectType.deleteOne( { name: wobject.object_type } );
                await expect( appendObjectValidator.validate( mockData, mockOp ) ).to.be.rejected;
            } );
        } );

        describe( 'when user on blacklist', async () => {
            it( 'should be rejected if author of operation in blacklist', async () => {
                mockOp.author = BLACK_LIST_BOTS[ faker.random.number( BLACK_LIST_BOTS.length ) ];
                mockData.field.author = mockOp.author;
                await expect( appendObjectValidator.validate( mockData, mockOp ) ).to.be.rejected;
            } );
            it( 'should be rejected with correct message if author of operation in blacklist', async () => {
                mockOp.author = BLACK_LIST_BOTS[ faker.random.number( BLACK_LIST_BOTS.length ) ];
                mockData.field.author = mockOp.author;
                await expect( appendObjectValidator.validate( mockData, mockOp ) )
                    .to.be.rejectedWith( Error, "Can't append object, user in blacklist!" );
            } );
            it( 'should be rejected if creator of "append" in blacklist', async () => {
                mockData.field.creator = BLACK_LIST_BOTS[ faker.random.number( BLACK_LIST_BOTS.length ) ];
                await expect( appendObjectValidator.validate( mockData, mockOp ) ).to.be.rejected;
            } );
        } );
    } );

} );

