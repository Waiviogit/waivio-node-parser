const { Wobj } = require( '../../models' );
const { BLACK_LIST_BOTS } = require( '../constants' );

const voteOnField = async ( data ) => {
    await findAndRemoveVote( data ); // case for un-vote
    if ( data.percent !== 0 ) {
        if ( data.percent < 0 ) {
            data.weight = -data.weight; // case for down-vote
        }
        await addVoteOnField( data ); // case for up-vote
    }
    await handleSpecifiedField( data.author, data.permlink, data.author_permlink );
};

const findAndRemoveVote = async ( data ) => { // data include: author, permlink, author_permlink, voter
    const res = await Wobj.findVote( data );

    if ( res && res.weight ) {
        if ( !BLACK_LIST_BOTS.includes( data.voter ) ) {
            await Wobj.increaseFieldWeight( { // if weight is negative - weight will be decreased
                author: data.author,
                permlink: data.permlink,
                author_permlink: data.author_permlink,
                weight: -res.weight
            } );
        }
        await Wobj.removeVote( data );
    }
};

const addVoteOnField = async ( data ) => {
    await Wobj.addVote( data );
    if ( !BLACK_LIST_BOTS.includes( data.voter ) ) {
        await Wobj.increaseFieldWeight( { // if weight is negative - weight will be decreased
            author: data.author,
            permlink: data.permlink,
            author_permlink: data.author_permlink,
            weight: data.weight
        } );
    }
};

const handleSpecifiedField = async ( author, permlink, author_permlink ) => {
    const { field, error } = await Wobj.getField( author, permlink, author_permlink );

    if ( error || !field ) {
        return;
    }
    switch ( field.name ) {
        case 'parent' :
            const { wobjects } = await Wobj.getSomeFields( 'parent', author_permlink );

            if ( wobjects && Array.isArray( wobjects ) && wobjects[ 0 ].fields && Array.isArray( wobjects[ 0 ].fields ) ) {
                await Wobj.update( { author_permlink }, { parent: wobjects[ 0 ].fields[ 0 ] } );
            }
            break;
    }
};

module.exports = { voteOnField };
