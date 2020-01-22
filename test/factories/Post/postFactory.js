const { faker, Post, commentRefSetter } = require( '../../testHelper' );
const _ = require( 'lodash' );

const Create = async ( { author, additionsForMetadata = {}, onlyData, parent_permlink, additionsForPost = {}, active_votes = [], app, root_author, permlink } = {} ) => { // additionsForMetadata(Post) must be an Object
    const json_metadata = {
        community: 'waiviotest',
        app: app || 'waiviotest',
        tags: [ 'testtag1', 'testtag2' ]
    };

    for ( const key in additionsForMetadata ) {
        json_metadata[ key ] = additionsForMetadata[ key ];
    }
    const post = {
        parent_author: '', // if it's post -> parent_author not exists
        parent_permlink: _.isNil( parent_permlink ) ? faker.random.string( 20 ) : parent_permlink,
        author: author || faker.name.firstName().toLowerCase(),
        permlink: permlink || faker.random.string( 20 ),
        title: faker.address.city(),
        body: faker.lorem.sentence(),
        json_metadata: JSON.stringify( json_metadata ),
        id: faker.random.number( 10000 ),
        active_votes,
        createdAt: faker.date.recent( 10 ).toString(),
        created: faker.date.recent( 10 ).toString()
    };
    post.root_author = root_author || post.author;
    post.root_permlink = post.permlink;

    for ( const key in additionsForPost ) {
        post[ key ] = additionsForPost[ key ];
    }
    if ( onlyData ) { // return only post data, but not create into database
        return post;
    }
    const new_post = await Post.create( post );
    await commentRefSetter.addPostRef(
        `${post.root_author}_${post.permlink}`,
        _.get( additionsForMetadata, 'wobj.wobjects', [] ),
        post.author === post.root_author ? null : post.author
    );

    return new_post.toObject();
};

module.exports = { Create };
