const axios = require( 'axios' );
const _ = require( 'lodash' );

module.exports = async ( wobject, host ) => {
    if ( _.has( wobject, ( 'author_permlink', 'default_name', 'author' ) ) ) {
        try {
            const result = await axios.post( `https://${host}/objects-bot/append-object`, {
                permlink: `name-${Math.random().toString( 36 ).substring( 2, 15 )}-${Math.random().toString( 36 ).substring( 2, 15 )}`,
                author: 'rutrader',
                parentAuthor: wobject.author,
                parentPermlink: wobject.author_permlink,
                body: `rutrader added name (en-US):  ${wobject.default_name}`,
                title: '',
                field: {
                    name: 'name',
                    body: wobject.default_name,
                    locale: 'en-US'
                }
            } );
            return result.status ;
        } catch ( error ) {
            console.error( error );
        }
    }
};

