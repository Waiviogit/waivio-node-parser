const WObjectModel = require('../database').models.WObject;

const create = async function (data) {
    const newWObject = new WObjectModel(data);
    try {
        return {wObject: await newWObject.save()};
    } catch (error) {
        return {error}
    }
};

const addField = async function (data) {
    try {
        await WObjectModel.updateOne({author_permlink: data.author_permlink},
            {
                $push:
                    {
                        fields: data.field
                    }
            });
        return {result: true};
    } catch (error) {
        return {error}
    }
};

const increaseFieldWeight = async function (data) {    //data include: author, permlink, author_permlink, weight
    try {
        await WObjectModel.updateOne({
            author_permlink: data.author_permlink,
            'fields.author': data.author,
            'fields.permlink': data.permlink
        }, {
            $inc: {
                'fields.$.weight': data.weight
            }
        });
        return {result: true}
    } catch (error) {
        return {error}
    }
};

const increaseWobjectWeight = async function (data) {
    try {
        await WObjectModel.updateOne({
            author_permlink: data.author_permlink
        }, {
            $inc: {
                weight: data.weight
            }
        });
        return {result: true}
    } catch (error) {
        return {error}
    }
};

const findVote = async function (data) {    //data include: author, permlink, author_permlink, voter
    try {
        const wobject = await WObjectModel.findOne({'author_permlink': data.author_permlink})
            .select('fields')
            .lean();
        if (wobject && wobject.fields) {
            const field = wobject.fields.find((field) => field.author === data.author && field.permlink === data.permlink);
            if (field) {
                const vote = field.active_votes.find((vote) => vote.voter === data.voter);
                if (vote) {
                    return {weight: vote.weight};
                }
            }
        }
        return {error: {message: 'vote not found'}}
    } catch (error) {
        return {error}
    }
};

const removeVote = async (data) => {  //data include: author, permlink, author_permlink, voter
    try {
        await WObjectModel.updateOne({
            author_permlink: data.author_permlink,
            'fields.author': data.author,
            'fields.permlink': data.permlink
        }, {
            $pull: {
                'fields.$.active_votes': {voter: data.voter}
            }
        });
    } catch (error) {
        return {error}
    }
};

const addVote = async (data) => {   //data include: author, permlink, author_permlink, voter, weight
    try {
        await WObjectModel.updateOne({
                author_permlink: data.author_permlink,
                'fields.author': data.author,
                'fields.permlink': data.permlink
            }, {
                $push: {
                    'fields.$.active_votes': {
                        voter: data.voter,
                        weight: data.weight
                    }
                }
            }
        )
    } catch (error) {
        return {error}
    }
};

//method for redis restore wobjects author and author_permlink
const getWobjectsRefs = async () => {
    try {
        return {
            wobjects: await WObjectModel.aggregate([
                {
                    $project: {
                        _id: 0,
                        author_permlink: 1
                    }
                }
            ])
        }
    } catch (error) {
        return {error}
    }
};

//method for redis restore fields author and author_permlink
const getFieldsRefs = async (author_permlink) => {
    try {
        return {
            fields: await WObjectModel.aggregate([
                {
                    $match: {author_permlink: author_permlink}
                },
                {
                    $unwind: '$fields'
                },
                {
                    $addFields: {
                        field_author: '$fields.author',
                        field_permlink: '$fields.permlink'
                    }
                },
                {
                    $project: {
                        _id: 0,
                        field_author: 1,
                        field_permlink: 1
                    }
                }
            ])
        }
    } catch (error) {
        return {error}
    }
};

const getWobjectTags = async () => {
    try {
        const [{wobject_tags}] = await WObjectModel.aggregate([
            {
                $unwind: '$fields'
            },
            {
                $match: {
                    'fields.name': 'tag'
                }
            },
            {
                $group: {
                    _id: null,
                    wobject_tags: {
                        $addToSet: {
                            tag: '$fields.body',
                            author_permlink: '$author_permlink'
                        }
                    }
                }
            }, {
                $project: {
                    _id: 0,
                    wobject_tags: 1
                }
            }
        ]);
        return {wobject_tags};
    } catch (error) {
        return {error}
    }
};


module.exports = {
    create,
    addField,
    increaseFieldWeight,
    increaseWobjectWeight,
    findVote,
    removeVote,
    addVote,
    getWobjectsRefs,
    getFieldsRefs,
    getWobjectTags
};