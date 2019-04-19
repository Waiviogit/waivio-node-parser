const { Wobj, Post, ObjectType } = require( '../../models' );
const { postRefsClient } = require( './redis' );
const redisSetter = require( './redisSetter' );

const restore = async function () {
    await postRefsClient.flushdbAsync();
    const { postsCount } = await restorePostsRefs();
    const { objectTypesCount } = await restoreObjectTypesRefs();
    const { fieldsCount, wobjectsCount } = await restoreWobjectsRefs();

    return { fieldsCount, wobjectsCount, postsCount, objectTypesCount };
};

const restoreWobjectsRefs = async function () {
    const { wobjects } = await Wobj.getWobjectsRefs(); // get refs(author_permlinks) of all wobjects
    let wobjectsCount = 0;
    let fieldsCount = 0;

    if ( wobjects && wobjects.length ) {
        wobjectsCount += wobjects.length;
        for ( const wobject of wobjects ) {
            await redisSetter.addWobjRef( wobject.author, wobject.author_permlink );
            const { fields } = await Wobj.getFieldsRefs( wobject.author_permlink ); // get refs of all fields in wobj

            if ( fields && fields.length ) {
                fieldsCount += fields.length;
                for ( const field of fields ) {
                    await redisSetter.addAppendWobj( `${field.field_author}_${field.field_permlink}`, wobject.author_permlink );
                }
            }
        }
    }
    return { wobjectsCount, fieldsCount };
};

const restorePostsRefs = async function () {
    const { posts } = await Post.getPostsRefs();
    let postsCount = 0;

    if ( posts && posts.length ) {
        postsCount += posts.length;
        for ( const post of posts ) {
            await redisSetter.addPostWithWobj( `${post.author}_${post.permlink}`, post.wobjects );
        }
    }
    return { postsCount };
};

const restoreObjectTypesRefs = async () => {
    const { objectTypes } = await ObjectType.getAll( { limit: 100, skip: 0 } );
    let objectTypesCount = 0;

    if ( objectTypes && objectTypes.length ) {
        objectTypesCount += objectTypes.length;
        for ( const objType of objectTypes ) {
            await redisSetter.addObjectType( objType.author, objType.permlink, objType.name );
        }
    }
    return { objectTypesCount };
};

module.exports = { restore };
