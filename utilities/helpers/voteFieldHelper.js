const { Wobj, User } = require( '../../models' );
const { BLACK_LIST_BOTS } = require( '../constants' );
const updateSpecificFieldHelper = require( './updateSpecificFieldsHelper' );
const _ = require( 'lodash' );
/**
 * Handle votes on append objects(Fields).
 * DownVotes do not use in app(just "UnVote" if vote already exist)
 * UpVotes depends on intigrity of value, if the value is integer(100 00, 40 00, 12 00 etc.) calculate as "UpVote",
 *      if the value is not integer (90 40, 10 99 etc.) calculate as "DownVote"
 * @param {Object} data include info about vote and append (field) (author, permlink, author_permlink, voter, percent, weight, rshares_weight)
 * @returns return nothing (or error)
 */
const voteOnField = async ( data ) => {
    // data : {author_permlink, author, permlink, voter, percent, weight, rshares_weight} (weight it's weight voter in current wobject)
    const { field, error: fieldError } = await Wobj.getField( data.author, data.permlink, data.author_permlink );

    if( fieldError ) return { error: fieldError };
    if( !field ) return{ error: { status: 404, message: 'Field not found!' } };

    if ( _.get( field, 'active_votes' ) ) {
        data.existingVote = field.active_votes.find( ( v ) => v.voter === data.voter );
    }
    data.creator = field.creator;

    await unVoteOnAppend( data );
    if ( data.percent > 0 && !BLACK_LIST_BOTS.includes( data.voter ) ) {
        await addVoteOnField( data );
    }
    await handleSpecifiedField( data.author, data.permlink, data.author_permlink );
};

// data includes: author, permlink, author_permlink, weight, creator, existingVote{voter, rshares_weight, weight, percent}
const unVoteOnAppend = async ( data ) => {
    const existingVote = data.existingVote;
    if( existingVote && existingVote.percent && existingVote.rshares_weight && existingVote.weight ) {
        await upDownVoteOnAppend( {
            ...data,
            weight: -existingVote.weight,
            percent: existingVote.percent,
            rshares_weight: -existingVote.rshares_weight
        } );
    }
    await Wobj.removeVote( data );
};

// data includes: author, permlink, author_permlink, weight, creator, existingVote(voter, rshares_weight, weight, percent)
const addVoteOnField = async ( data ) => {
    data.percent = calculateVotePercent( data.percent );
    data.weight = ( data.weight + data.rshares_weight * 0.25 ) * ( data.percent / 100 );
    await upDownVoteOnAppend( { ...data, isDownVote: ( data.percent < 0 ) } );

    await Wobj.addVote( {
        ...data,
        vote: { voter: data.voter, percent: data.percent, rshares_weight: data.rshares_weight, weight: data.weight }
    } );
};

/**
 * Increase weight of field, voter and author of field.
 * Use as UpVote on field and as DownVote on field(depends on rshares and weight value)
 * Rshares weight, wobject weight and percent need to be calculated before, separately
 * @param author Author of field(bot name, who write down comment to blockchain)
 * @param permlink Permlink of comment with "Field"
 * @param author_permlink ID of root wobject
 * @param weight Voter current weight in current wobject
 * @param rshares_weight Rshares of current Vote
 * @param percent Voter Percent of current Vote
 * @param creator Person who create field (not to be confused with bot who write down comment to blockchain)
 * @param voter Person who vote for field(Approve or Reject)
 * @param isDownVote Flag to indicate UpVote or DownVote (if down vote => revert increasing weight to voter)
 * @returns {Promise<void>}
 */
const upDownVoteOnAppend = async ( { author, permlink, author_permlink, weight, creator, voter, rshares_weight, percent, isDownVote = false } ) => {
    // increase weight of voter
    await User.increaseWobjectWeight( {
        name: voter,
        author_permlink,
        weight: rshares_weight * 0.25 * ( percent / 100 ) * ( isDownVote ? -1 : 1 )
    } );
    // increase weight of field author
    await User.increaseWobjectWeight( {
        name: creator,
        author_permlink,
        weight: rshares_weight * 0.75 * ( percent / 100 )
    } );
    // increase weight of field
    await Wobj.increaseFieldWeight( { author, permlink, author_permlink, weight } );
};

/**
 * Get real percent of vote on field and return virtual percent inside app waivio, in usual format (for ex: 55.5)
 * @param {Number} percent Number from 1 to 10000
 * @returns {Number} Number from 1 to 100
 */
const calculateVotePercent = ( percent ) => {
    if ( percent % 100 === 0 ) return percent / 100 ;
    return -Math.round( percent / 100 ) ;
};

const handleSpecifiedField = async ( author, permlink, author_permlink ) => {
    const { field, error } = await Wobj.getField( author, permlink, author_permlink );

    if ( error || !field ) return;
    await updateSpecificFieldHelper.update( author, permlink, author_permlink );
};

module.exports = { voteOnField };
