const { WObject } = require( '../../../database' ).models;
const getComments = require( './getComments' );
const appendObjectParser = require( '../../../parsers/appendObjectParser' );
const fs = require( 'fs' );

const getWobjects = async () => {
    try{
        const result = await WObject.aggregate( [
            { $match: { fields: { $size: 0 } } },
            { $project: { author: 1, author_permlink: 1, _id: 0 } }
        ] );
        return { result };
    }catch( error ) {
        return { error };
    }
};

const appendWobjectFields = async ( wobject ) => {
    const { result: comments } = await getComments( wobject.author, wobject.author_permlink );
    if ( !comments ) {
        fs.appendFileSync( './utilities/tasks/appendWobjectFields/emptyWobjects.json', JSON.stringify( wobject ) );
        console.log( 'Have some problem wobject' );
        return;
    }
    for ( let comment of comments ) {
        if ( !comment.metadata.wobj ) continue;
        await appendObjectParser.parse( comment.operation, comment.metadata );
    }
};

const appendFields = async () => {
    fs.writeFileSync( './utilities/tasks/appendWobjectFields/emptyWobjects.json', '' );
    const { result: wobjWithoutFields } = await getWobjects();
    for ( let wobject of wobjWithoutFields ) {
        await appendWobjectFields( wobject );
    }
};

module.exports = { appendFields };

