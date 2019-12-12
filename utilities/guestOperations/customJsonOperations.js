const { userParsers, followObjectParser } = require( '../../parsers' );
const { validateProxyBot } = require( './guestHelpers' );
const _ = require( 'lodash' );

exports.followUser = async ( operation ) => {
    if( validateProxyBot( _.get( operation, 'required_posting_auths[0]' ) ) ) {
        let json;
        try {
            json = JSON.parse( operation.json );
        } catch ( error ) {
            console.error( error );
            return;
        }
        operation.required_posting_auths = [ _.get( json, '[1].follower' ) ];
        await userParsers.followUserParser( operation );
    }
};

exports.followWobject = async ( operation ) => {
    if( validateProxyBot( _.get( operation, 'required_posting_auths[0]' ) ) ) {
        let json;
        try {
            json = JSON.parse( operation.json );
        } catch ( error ) {
            console.error( error );
            return;
        }
        operation.required_posting_auths = [ _.get( json, '[1].user' ) ];
        await followObjectParser.parse( operation );
    }
};
