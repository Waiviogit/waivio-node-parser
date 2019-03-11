const requiredFieldsCreateObject = 'author_permlink,author,creator,app,object_type,fields,default_name'.split(',');    //for object
const requiredFieldsAppendObject = 'name,body,locale,author,permlink,creator'.split(',');                   //for field

const validateCreateObject = (data) => {
    let isValid = true;
    requiredFieldsCreateObject.forEach(field => {
        if (data[field] === undefined || data[field] === null) isValid = false
    });
    requiredFieldsAppendObject.forEach(field=>{
        if (data.fields[0][field] === undefined || data.fields[0][field] === null) isValid = false
    });
    return isValid;
};

const validateAppendObject = (data) => {
    let isValid = true;
    requiredFieldsAppendObject.forEach(field => {
        if (data[field] === undefined || data[field] === null) isValid = false
    });
    return isValid;
};

module.exports = {
    validateAppendObject, validateCreateObject,
};