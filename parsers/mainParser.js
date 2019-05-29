const { followObjectParser, commentParser, voteParser, userParsers } = require( '../parsers' );
const { ratingHelper } = require( '../utilities/helpers' );

const parseSwitcher = async ( transactions ) => {
    const votesOps = [];

    for ( const transaction of transactions ) {
        if ( transaction && transaction.operations && transaction.operations[ 0 ] ) {
            for ( const operation of transaction.operations ) {
                switch ( operation[ 0 ] ) {
                    case 'comment' :
                        await commentParser.parse( operation[ 1 ] );
                        break;
                    case 'vote' :
                        votesOps.push( operation[ 1 ] );
                        break;
                    case 'custom_json' :
                        switch ( operation[ 1 ].id ) {
                            case 'follow_wobject' :
                                await followObjectParser.parse( operation[ 1 ] );
                                break;
                            case 'wobj_rating' :
                                await ratingHelper.parse( operation[ 1 ] );
                                break;

                            case 'follow' :
                                await userParsers.followUserParser( operation[ 1 ] );
                                break;
                        }
                        break;
                    case 'account_update' :
                        await userParsers.updateAccountParser( operation[ 1 ] );
                }
            }
        }
    }
    await voteParser.parse( votesOps );
};

module.exports = {
    parseSwitcher
};
