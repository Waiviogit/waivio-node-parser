const moment = require( 'moment' );
const ObjectId = require( 'mongoose' ).Types.ObjectId;

exports.objectIdFromDateString = ( dateStr ) => {
    const timestamp = moment.utc( dateStr ).format( 'x' );
    let str = `${Math.floor( timestamp / 1000 ).toString( 16 ) }0000000000000000`;
    return new ObjectId( str );
};
