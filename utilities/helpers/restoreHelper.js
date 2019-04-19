const { Wobj } = require( '../../models' );

const restore = async function () {
    await restoreWobjectParents();
    await restoreWobjectChildren();

};

const restoreWobjectParents = async function() {
    const { fields } = await Wobj.getSomeFields( 'parent' );

    if( fields && Array.isArray( fields ) ) {
        for( const wobject of fields ) {
            if( wobject && wobject.fields && Array.isArray( wobject.fields ) ) {
                await Wobj.update( { author_permlink: wobject.author_permlink }, { parents: wobject.fields.slice( 0, 5 ) } );
            }
        }
    }
};

const restoreWobjectChildren = async function() {
    const { fields } = await Wobj.getSomeFields( 'child_object' );

    if( fields && Array.isArray( fields ) ) {
        for( const wobject of fields ) {
            if( wobject && wobject.fields && Array.isArray( wobject.fields ) ) {
                await Wobj.update( { author_permlink: wobject.author_permlink }, { children: wobject.fields.slice( 0, 5 ) } );
            }
        }
    }
};


module.exports = { restore };
