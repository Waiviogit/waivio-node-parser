const { Wobj, User } = require( '../../models' );
const { BLACK_LIST_BOTS } = require( '../constants' );
const updateSpecificFieldHelper = require( './updateSpecificFieldsHelper' );
const _ = require( 'lodash' );
/**
 * Handle votes on append objects.
 * DownVotes do not use in app(just "UnVote" if vote already exist)
 * UpVotes depends on intigrity of value, if the value is integer(100 00, 40 00 etc.) calculate as "UpVote",
 *      if the value is not integer (90 40, 10 99 etc.) calculate as "DownVote"
 * @param {Object} data include data about vote and append (author, permlink, author_permlink, voter, percent, weight)
 * @returns return nothing (or error)
 */
const voteOnField = async ( data ) => {
    // data : {author_permlink, author, permlink, voter, percent, weight, rshares_weight} (weight it's weight voter in current wobject)
    const { field, error: fieldError } = await Wobj.getField( data.author, data.permlink, data.author_permlink );

    if( fieldError ) return { error: fieldError };
    if( !field ) return{ error: { status: 404, message: 'Field not found!' } };

    if ( field && field.active_votes ) {
        data.existingVote = field.active_votes.find( ( v ) => v.voter === data.voter );
    }
    data.creator = field.creator;

    await unVoteOnAppend( data );
    if ( data.percent > 0 && !BLACK_LIST_BOTS.includes( data.voter ) ) {
        await addVoteOnField( data );
    }
    await handleSpecifiedField( data.author, data.permlink, data.author_permlink );
};

// data includes: author, permlink, author_permlink, weight, creator, existingVote(voter, rshares_weight, weight, percent)
const unVoteOnAppend = async ( data ) => {
    if( _.get( data, 'existingVote.percent' ) && _.get( data, 'existingVote.rshares_weight' ) && _.get( data, 'existingVote.weight' ) ) {
        if ( data.existingVote.percent > 0 ) {
            await upVoteOnAppend( {
                ...data,
                weight: -data.existingVote.weight,
                percent: data.existingVote.percent,
                rshares_weight: -data.existingVote.rshares_weight
            } );
        } else if ( data.existingVote.percent < 0 ) {
            await downVoteOnAppend( {
                ...data,
                weight: -data.existingVote.weight,
                percent: data.existingVote.percent,
                rshares_weight: -data.existingVote.rshares_weight
            } );
        }
    }
    await Wobj.removeVote( data );
};

// data includes: author, permlink, author_permlink, weight, creator, existingVote(voter, rshares_weight, weight, percent)
const addVoteOnField = async ( data ) => {
    data.percent = calculateVotePercent( data.percent );
    if( data.percent > 0 ) {
        data.weight = ( data.weight + data.rshares_weight * 0.25 ) * ( data.percent / 100 );
        await upVoteOnAppend( data );
    } else if ( data.percent < 0 ) {
        data.weight = data.weight * ( data.percent / 100 );
        await downVoteOnAppend( data );
    }
    await Wobj.addVote( {
        ...data,
        vote: { voter: data.voter, percent: data.percent, rshares_weight: data.rshares_weight, weight: data.weight }
    } );
};

// data includes: author, permlink, author_permlink, weight, creator
const downVoteOnAppend = async ( data ) => {
    // increase weight of append and creator ("weight" need to be already inverted)
    await Wobj.increaseFieldWeight( {
        author: data.author,
        permlink: data.permlink,
        author_permlink: data.author_permlink,
        weight: data.weight
    } );
    // increase weight of append creator
    await User.increaseWobjectWeight( {
        name: data.creator,
        author_permlink: data.author_permlink,
        weight: data.rshares_weight * 0.75 * ( data.percent / 100 )
    } );
    // ///////////////////////////// //
    // here can be incr. voter weight//
    // ///////////////////////////// //
};

// data includes: author, permlink, author_permlink, weight, creator, voter
const upVoteOnAppend = async ( data ) => {
    // increase weight of voter
    await User.increaseWobjectWeight( {
        name: data.voter,
        author_permlink: data.author_permlink,
        weight: data.rshares_weight * 0.25 * ( data.percent / 100 )
    } );
    // increase weight of append author
    await User.increaseWobjectWeight( {
        name: data.creator,
        author_permlink: data.author_permlink,
        weight: data.rshares_weight * 0.75 * ( data.percent / 100 )
    } );
    // increase weight of append
    await Wobj.increaseFieldWeight( {
        author: data.author,
        permlink: data.permlink,
        author_permlink: data.author_permlink,
        weight: data.weight
    } );
};

/**
 * Get real percent of vote on append and return virtual percent inside app waivio, in usual format (for ex: 55.5)
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
