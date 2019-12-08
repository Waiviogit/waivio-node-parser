const { Wobj, User } = require( '../models' );
const { createObjectValidator } = require( '../validator' );
const { commentRefSetter, commentRefGetter } = require( '../utilities/commentRefService' );
const { wobjectHelper } = require( '../utilities/helpers' );


const parse = async ( operation, metadata ) => {
    const data = {
        author_permlink: operation.permlink,
        author: operation.author,
        creator: metadata.wobj.creator,
        app: metadata.app,
        community: metadata.community,
        is_posting_open: metadata.wobj.is_posting_open,
        is_extending_open: metadata.wobj.is_extending_open,
        default_name: metadata.wobj.default_name
    };
    const { wobject, error } = await createObject( data, operation );
    if( error ) console.error( error );
    if ( wobject ) console.log( `Waivio object ${data.default_name} created!\n` );
    await wobjectHelper.addSupposedUpdates( wobject );
};

const createObject = async ( data, operation ) => {
    try {
        await createObjectValidator.validate( data, operation );

        const objectTypeRef = await commentRefGetter.getCommentRef( `${operation.parent_author }_${ operation.parent_permlink}` );
        data.object_type = objectTypeRef.name;

        const { wObject, error } = await Wobj.create( data );
        if ( error ) return { error };

        await commentRefSetter.addWobjRef( `${data.author }_${ data.author_permlink}`, data.author_permlink );
        await User.increaseWobjectWeight( {
            name: data.creator,
            author_permlink: data.author_permlink,
            weight: 1
        } );

        return { wobject: wObject._doc };
    } catch ( error ) {
        return { error };
    }
};

module.exports = { parse };
