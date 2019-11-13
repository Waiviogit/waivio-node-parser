const { ObjectType } = require( '../models' );
const { commentRefSetter } = require( '../utilities/commentRefService' );
const { wobjectValidator } = require( '../validator' );
const _ = require( 'lodash' );

const parse = async ( operation, metadata ) => {
    try {
        const data = {
            name: _.get( metadata, 'wobj.name' ),
            author: operation.author,
            permlink: operation.permlink
        };

        await createObjectType( data );
        console.log( `Object Type ${data.name} created!` );
    } catch ( e ) {
        console.error( e );
    }
};

const createObjectType = async ( data ) => {
    if ( wobjectValidator.validateObjectType( data ) ) {
        await ObjectType.create( data );
        await commentRefSetter.addWobjTypeRef( `${data.author}_${data.permlink}`, data.name );
    } else {
        throw new Error( 'Data is not valid' );
    }
};

module.exports = { parse };
