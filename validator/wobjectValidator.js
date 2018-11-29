const requiredFieldsCreateObject = 'authorPermlink,app,object_type,fields'.split(',');    //for object
const requiredFieldsAppendObject = 'name,body,locale,author,permlink'.split(',');                   //for field

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