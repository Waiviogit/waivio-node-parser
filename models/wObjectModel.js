const WObjectModel = require( '../database' ).models.WObject;
const ObjectTypes = require( '../database' ).models.ObjectType;
const { WOBJECT_LATEST_POSTS_COUNT } = require( '../utilities/constants' );

const create = async function ( data ) {
    const newWObject = new WObjectModel( data );

    try {
        return { wObject: await newWObject.save() };
    } catch ( error ) {
        return { error };
    }
};

const update = async function ( conditions, updateData ) {
    try {
        const result = await WObjectModel.updateOne( conditions, updateData );
        return { result: result.nModified === 1 };
    } catch ( error ) {
        return { error };
    }
};

const addField = async function ( data ) {
    try {
        let result = await WObjectModel.updateOne( { author_permlink: data.author_permlink },
            {
                $push:
                    {
                        fields: data.field
                    }
            } );
        return { result: result.nModified === 1 };
    } catch ( error ) {
        return { error };
    }
};

const increaseFieldWeight = async function ( data ) { // data include: author, permlink, author_permlink, weight
    try {
        let result = await WObjectModel.updateOne( {
            author_permlink: data.author_permlink,
            'fields.author': data.author,
            'fields.permlink': data.permlink
        }, {
            $inc: {
                'fields.$.weight': data.weight
            }
        } );
        return { result: result.nModified === 1 };
    } catch ( error ) {
        return { error };
    }
};

const increaseWobjectWeight = async function ( data ) {
    try {
        const wobj = await WObjectModel.findOne( { author_permlink: data.author_permlink } );

        if( wobj ) {
            await WObjectModel.updateOne( { author_permlink: data.author_permlink },
                { $inc: { weight: data.weight } } );
            await ObjectTypes.updateOne(
                { name: wobj.object_type },
                { $inc: { weight: data.weight } } );
            return { result: true };
        }
        return { result: false };
    } catch ( error ) {
        return { error };
    }
};

const removeVote = async ( data ) => { // data include: author, permlink, author_permlink, voter
    try {
        let result = await WObjectModel.updateOne( {
            author_permlink: data.author_permlink,
            'fields.author': data.author,
            'fields.permlink': data.permlink
        }, {
            $pull: {
                'fields.$.active_votes': { voter: data.voter }
            }
        } );
        return { result: result.nModified === 1 };
    } catch ( error ) {
        return { error };
    }
};

const addVote = async ( data ) => { // data include: author, permlink, author_permlink, voter, weight
    try {
        let result = await WObjectModel.updateOne( {
            author_permlink: data.author_permlink,
            'fields.author': data.author,
            'fields.permlink': data.permlink
        },
        { $push: { 'fields.$.active_votes': { ...data.vote } } }
        );
        return { result: result.nModified === 1 };
    } catch ( error ) {
        return { error };
    }
};

// method for redis restore wobjects author and author_permlink
const getWobjectsRefs = async () => {
    try {
        return {
            wobjects: await WObjectModel.aggregate( [
                { $project: { _id: 0, author_permlink: 1, author: 1 } }
            ] )
        };
    } catch ( error ) {
        return { error };
    }
};

// method for redis restore fields author and author_permlink
const getFieldsRefs = async ( author_permlink ) => {
    try {
        return {
            fields: await WObjectModel.aggregate( [
                { $match: { author_permlink: author_permlink } },
                { $unwind: '$fields' },
                { $addFields: { field_author: '$fields.author', field_permlink: '$fields.permlink' } },
                { $project: { _id: 0, field_author: 1, field_permlink: 1 } }
            ] )
        };
    } catch ( error ) {
        return { error };
    }
};

const getSomeFields = async ( fieldName, author_permlink ) => {
    try {
        const wobjects = await WObjectModel.aggregate( [
            { $match: { author_permlink: author_permlink || /.*?/ } },
            { $unwind: '$fields' },
            { $match: { 'fields.name': fieldName || /.*?/ } },
            { $sort: { 'fields.weight': -1 } },
            { $group: { _id: '$author_permlink', fields: { $push: '$fields.body' } } },
            { $project: { _id: 0, author_permlink: '$_id', fields: 1 } }
        ] );

        return { wobjects };
    } catch ( error ) {
        return { error };
    }
};

const getField = async ( author, permlink, author_permlink ) => {
    try {
        const [ field ] = await WObjectModel.aggregate( [
            { $match: { author_permlink: author_permlink || /.*?/ } },
            { $unwind: '$fields' },
            { $match: { 'fields.author': author || /.*?/, 'fields.permlink': permlink } },
            { $replaceRoot: { newRoot: '$fields' } }
        ] );

        return { field };
    } catch ( error ) {
        return { error };
    }
};

const updateField = async ( author, permlink, author_permlink, key, value ) => {
    try {
        let result = await WObjectModel.updateOne(
            { author_permlink, 'fields.author': author, 'fields.permlink': permlink },
            { $set: { [ `fields.$.${key}` ]: value } }
        );
        return { result: result.nModified === 1 };
    } catch ( e ) {
        return { error: e };
    }
};

const getOne = async ( { author_permlink } ) => {
    try {
        const wobject = await WObjectModel.findOne( { author_permlink: author_permlink } ).lean();

        if ( !wobject ) {
            return { error: { status: 404, message: 'Wobject not found!' } };
        }
        return { wobject };
    } catch ( e ) {
        return { error: e };
    }
};

const pushNewPost = async ( { author_permlink, post_id } ) => {
    try {
        const result = await WObjectModel.updateOne( { author_permlink }, {
            $push: {
                latest_posts: {
                    $each: [ post_id ],
                    $position: 0,
                    $slice: WOBJECT_LATEST_POSTS_COUNT
                }
            },
            $inc: { count_posts: 1, last_posts_count: 1 }
        } );
        return { result: result.nModified === 1 };
    } catch ( e ) {
        return { error: e };
    }
};

module.exports = {
    getOne,
    create,
    update,
    addField,
    increaseFieldWeight,
    increaseWobjectWeight,
    removeVote,
    addVote,
    getWobjectsRefs,
    getFieldsRefs,
    getSomeFields,
    getField,
    updateField,
    pushNewPost
};
