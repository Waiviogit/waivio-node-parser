const followObjectParser = require( './followObjectParser' );
const userParsers = require( './userParsers' );
const { ratingHelper } = require( '../utilities/helpers' );

exports.parse = async ( operation ) => {
    switch ( operation[ 1 ].id ) {
        case 'follow_wobject' :
            await followObjectParser.parse( operation );
            break;
        case 'wobj_rating' :
            await ratingHelper.parse( operation );
            break;
        case 'follow' :
            await userParsers.followUserParser( operation );
            break;
        // guests operations
        case 'waivio_guest_create' :
            // waivio_guest_create
            break;
        case 'waivio_guest_update' :
            // waivio_guest_update
            break;
        case 'waivio_guest_vote' :
            // waivio_guest_vote
            break;
        case 'waivio_guest_follow' :
            // waivio_guest_follow
            break;
        case 'waivio_guest_follow_wobject' :
            // waivio_guest_follow
            break;

    }
};
