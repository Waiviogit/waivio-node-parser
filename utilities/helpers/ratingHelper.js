const { Wobj } = require( '../../models' );
const { wobjectValidator } = require( '../../validator' );
const _ = require( 'lodash' );

const parse = async ( operation ) => {
    let json;

    try {
        json = JSON.parse( operation.json );
    } catch ( err ) {
        console.error( err );
        return;
    }
    if ( !wobjectValidator.validateRatingVote( json ) ) {
        console.error( 'Rating vote data is not valid!' );
        return;
    }
    const voter = operation.required_posting_auths[ 0 ];
    const author = json.author;
    const permlink = json.permlink;
    const author_permlink = json.author_permlink;
    const rate = json.rate;

    const { field, error } = await Wobj.getField( author, permlink, author_permlink );

    if ( error || !field || field.name !== 'rating' ) return;
    let rating_votes = field.rating_votes || [];
    // remove existing vote for current user and push new (replace vote)
    _.remove( rating_votes, ( v ) => v.voter === voter );
    rating_votes.push( { voter, rate } );
    await Wobj.updateField( author, permlink, author_permlink, 'rating_votes', rating_votes );
    await Wobj.updateField( author, permlink, author_permlink, 'average_rating_weight', _.meanBy( rating_votes, 'rate' ) );
};

module.exports = { parse };
