const constants = require( '../constants' );

exports.validateProxyBot = ( username ) => {
    return constants.WAIVIO_PROXY_BOTS.includes( username );
};
