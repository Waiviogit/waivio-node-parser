const WObjectModel = require( '../database' ).models.WObject;
const ObjectTypes = require( '../database' ).models.ObjectType;

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
        const result = await WObjectModel.findOneAndUpdate( conditions, updateData );

        return { result };
    } catch ( error ) {
        return { error };
    }
};

const addField = async function ( data ) {
    try {
        await WObjectModel.updateOne( { author_permlink: data.author_permlink },
            {
                $push:
                    {
                        fields: data.field
                    }
            } );
        return { result: true };
    } catch ( error ) {
        return { error };
    }
};

const increaseFieldWeight = async function ( data ) { // data include: author, permlink, author_permlink, weight
    try {
        await WObjectModel.updateOne( {
            author_permlink: data.author_permlink,
            'fields.author': data.author,
            'fields.permlink': data.permlink
        }, {
            $inc: {
                'fields.$.weight': data.weight
            }
        } );
        return { result: true };
    } catch ( error ) {
        return { error };
    }
};

const increaseWobjectWeight = async function ( data ) {
    try {
        const wobj = await WObjectModel.findOneAndUpdate(
            { author_permlink: data.author_permlink },
            { $inc: { weight: data.weight } },
            { new: true } );

        if( wobj && wobj.object_type )
            await ObjectTypes.updateOne(
                { name: wobj.object_type },
                { $inc: { weight: data.weight } } );

        return { result: true };
    } catch ( error ) {
        return { error };
    }
};

const removeVote = async ( data ) => { // data include: author, permlink, author_permlink, voter
    try {
        await WObjectModel.updateOne( {
            author_permlink: data.author_permlink,
            'fields.author': data.author,
            'fields.permlink': data.permlink
        }, {
            $pull: {
                'fields.$.active_votes': { voter: data.voter }
            }
        } );
    } catch ( error ) {
        return { error };
    }
};

const addVote = async ( data ) => { // data include: author, permlink, author_permlink, voter, weight
    try {
        await WObjectModel.updateOne( {
            author_permlink: data.author_permlink,
            'fields.author': data.author,
            'fields.permlink': data.permlink
        },
        { $push: { 'fields.$.active_votes': { ...data.vote } } }
        );
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
        await WObjectModel.update(
            { author_permlink, 'fields.author': author, 'fields.permlink': permlink },
            { $set: { [ `fields.$.${key}` ]: value } }
        );
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
    updateField
};
