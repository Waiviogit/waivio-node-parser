const _ = require('lodash');

const validateCreateObject = (data) => {
    let isValid = true;
    const requiredFieldsCreateObject = 'author_permlink,author,creator,app,object_type,fields,default_name'.split(',');
    requiredFieldsCreateObject.forEach(field => {
        if (_.isNil(data[field]))
            isValid = false
    });
    return isValid;
};

const validateAppendObject = (data) => {
    let isValid = true;
    const requiredFieldsAppendObject = 'name,body,locale,author,permlink,creator'.split(',');
    requiredFieldsAppendObject.forEach(field => {
        if (_.isNil(data[field]))
            isValid = false
    });
    return isValid;
};

const validateRatingVote = data => {
    let isValid = true;
    const requiredFieldsRatingVote = 'author,permlink,author_permlink,rate'.split(',');
    requiredFieldsRatingVote.forEach(field => {
        if (_.isNil(data[field]))
            isValid = false;
    });
    return isValid
};

const validateObjectType = data => {
    let isValid = true;
    const requriedFieldsObjectType = 'author,permlink,name'.split(',');
    requriedFieldsObjectType.forEach(field => {
        if (_.isNil(data[field]))
            isValid = false;
    });
    return isValid;
};

module.exports = {
    validateAppendObject, validateCreateObject, validateRatingVote, validateObjectType
};