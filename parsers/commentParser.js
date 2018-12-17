const createObjectParser = require('./createObjectParser');
const appendObjectParser = require('./appendObjectParser');
const postWithObjectsParser = require('./postWithObjectParser');

const parse = async function (operation) {  //data is operation[1] of transaction in block
    let metadata;
    try {
        if (operation.json_metadata !== '') {
            metadata = JSON.parse(operation.json_metadata)          //parse json_metadata from string to JSON
        }
    } catch (e) {
        console.log(e)
    }
    if (operation.parent_author === '') {   //comment without parent_author is post
        if (metadata && metadata.wobj) {
            if (metadata.wobj.field) {
                createObjectParser.parse(operation, metadata);      //create wobject in database
            } else if (metadata.wobj.wobjects) {
                postWithObjectsParser.parse(operation);             //create post with wobjects in database
            }
        }
    } else {                                //comment with parent_author is reply to post
        if (metadata && metadata.wobj) {
            if (metadata.wobj.field) {
                appendObjectParser.parse(operation, metadata);      //add field to wobject in database
            } else if (metadata.wobj.wobjects) {
                // #parse reply to post with list wobjects
            }
        }
    }
};

module.exports = {parse};