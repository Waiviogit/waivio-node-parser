const constants = require( '../constants' );
const METADATA_GUEST_MARKERS = 'userId,displayName,social'.split( ',' );
const _ = require( 'lodash' );

exports.validateProxyBot = ( username ) => {
    return constants.WAIVIO_PROXY_BOTS.includes( username );
};

exports.getFromMetadataGuestInfo = ( { operation, metadata } ) => {
    if( this.validateProxyBot( _.get( operation, 'author' ) ) && _.get( metadata, 'comment' ) ) {
        if( _.every( METADATA_GUEST_MARKERS, ( m ) => metadata.comment[ m ] && _.isString( metadata.comment[ m ] ) ) ) {
            return _.pick( metadata.comment, METADATA_GUEST_MARKERS );
        }
    }
};

