const { Wobj, User } = require( '../models' );
const { createObjectValidator } = require( '../validator' );
const { redisGetter } = require( '../utilities/redis' );
const { commentRefSetter } = require( '../utilities/commentRefService' );

const parse = async function ( operation, metadata ) {
    try {
        const data = {
            author_permlink: operation.permlink,
            author: operation.author,
            creator: metadata.wobj.creator,
            app: metadata.app,
            community: metadata.community,
            is_posting_open: metadata.wobj.is_posting_open,
            is_extending_open: metadata.wobj.is_extending_open,
            default_name: metadata.wobj.default_name
            // object_type: metadata.wobj.object_type.toLowerCase()
        };
        const res = await createObject( data, operation );
        if( res.error ) console.error( res.error );
        if ( res ) {
            console.log( `Waivio object ${data.default_name} created!\n` );
        }
    } catch ( error ) {
        console.error( error );
    }
};

const createObject = async function ( data, operation ) {
    try {
        await createObjectValidator.validate( data, operation );
        const redisObjectType = await redisGetter.getHashAll( `${operation.parent_author }_${ operation.parent_permlink}` );

        data.object_type = redisObjectType.name;
        const { wObject, error } = await Wobj.create( data );

        if ( error ) return { error };
        await commentRefSetter.addWobjRef( `${data.author }_${ data.author_permlink}`, data.author_permlink );
        await User.increaseWobjectWeight( {
            name: data.creator,
            author_permlink: data.author_permlink,
            weight: 1
        } );
        return wObject._doc;
    } catch ( error ) {
        return { error };
    }
};

module.exports = { parse };
