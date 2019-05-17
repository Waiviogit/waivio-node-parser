const { expect, sinon } = require( '../../testHelper' );
const { appendObjectValidator } = require( '../../../validator' );
const { ObjectFactory, AppendObject } = require( '../../factories' );

describe( 'Append Object Validator', async () => {
    let mockData, mockOperation; // validator takes 2 params, 1-st is "data", 2-nd is "operation"
    let validateFieldsSpy;
    let validatePostLinksSpy;
    let validateFieldsError;

    let validatePostLinksError;

    beforeEach( async () => {
        validateFieldsSpy = sinon.spy( appendObjectValidator, 'validateFields' );
        validatePostLinksSpy = sinon.spy( appendObjectValidator, 'validatePostLinks' );

    } );
    afterEach( async () => {
        validateFieldsSpy.restore();
        validatePostLinksSpy.restore();

    } );

    it( 'should not throw error if all fields is exist', () => {
        const tempMockAppendData = {
            field: {
                name: 'name',
                body: 'body',
                locale: 'locale',
                author: 'user',
                permlink: 'permlink',
                creator: 'user2'
            }
        };

        mockData = tempMockAppendData;
        try {
            validateFieldsSpy( mockData );
        } catch ( e ) {
            validateFieldsError = e;
        }

        expect( validateFieldsSpy.threw() ).to.be.false;

    } );

    describe( 'when not all required fields exist', async () => {
        it( 'should throw error "Can`t append object, not all required fields is filling!"', () => {
            const requiredFields = 'name,body,locale,author,permlink,creator'.split( ',' );
            const tempMockAppendData = {
                field: {
                    name: 'name',
                    body: 'body',
                    locale: 'locale',
                    author: 'user',
                    permlink: 'permlink',
                    creator: 'user2'
                }
            };

            for ( const field of requiredFields ) {
                mockData = tempMockAppendData;
                delete mockData.field[ field ];
                try {
                    validateFieldsSpy( mockData );
                } catch ( e ) {
                    validateFieldsError = e;
                }

                expect( validateFieldsSpy.threw() ).to.be.true;
                expect( validateFieldsError.message ).to.equal( "Can't append object, not all required fields is filling!" );
            }
        } );
    } );

    describe( 'on validate post links', async () => {
        let wobject;
        let append;

        before( async () => {
            wobject = await ObjectFactory.Create();
        } );

        describe( 'when parent comment isn`t create Object Comment', async () => {
            const tempMockOperation = {
                author: 'someAuthor',
                permlink: 'somePermlink',
                parent_author: 'someParentAuthor',
                parent_permlink: 'someParentPermlink'
            };

            it( 'should throw error "Can\'t append object, parent comment isn\'t create Object comment!"', async () => {
                mockOperation = tempMockOperation;
                try {
                    await validatePostLinksSpy( mockOperation );
                } catch ( e ) {
                    validatePostLinksError = e;
                }

                // expect( validatePostLinksSpy.threw() ).to.be.true;
                expect( validatePostLinksError.message ).to.equal( "Can't append object, parent comment isn't create Object comment!" );

            } );

        } );

        describe( 'when parent comment is create Object Comment', async () => {

            it( 'should throw error "Can\'t append object, parent comment isn\'t create Object comment!"', async () => {

                try {
                    await validatePostLinksSpy( {
                        author: 'someAuthor',
                        permlink: 'somePermlink',
                        parent_author: wobject.author,
                        parent_permlink: wobject.author_permlink
                    } );
                } catch ( e ) {
                    validatePostLinksError = e;
                }

                expect( validatePostLinksSpy.threw() ).to.be.false;
            } );

        } );

        describe( 'when append is already exist', async () => {
            before( async () => {
                wobject = await ObjectFactory.Create();
                let { appendObject } = await AppendObject.Create( { root_wobj: wobject.author_permlink } );

                append = appendObject;
            } );

            it( 'should throw error "Can\'t append object, append is now exist!"', async () => {
                try {
                    await validatePostLinksSpy( {
                        author: append.author,
                        permlink: append.permlink,
                        parent_author: wobject.author,
                        parent_permlink: wobject.author_permlink
                    } );
                } catch ( e ) {
                    validatePostLinksError = e;
                }
                expect( validatePostLinksError.message ).to.equal( "Can't append object, append is now exist!" );
            } );
        } );
    } );
} );

