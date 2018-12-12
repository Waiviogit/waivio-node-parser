const createObjectParser = require('./createObjectParser');
const appendObjectParser = require('./appendObjectParser');

const parse = async function (operation) {  //data is operation[1] of transaction in block
    let metadata;
    try {
        if (operation.json_metadata !== '') {
            metadata = JSON.parse(operation.json_metadata)
        }
    } catch (e) {
        console.log(e)
    }
    if (operation.parent_author === '') {   //comment without parent_author is post
        if (metadata && metadata.wobj) {
            if (metadata.wobj.field) {
                createObjectParser.parse(operation, metadata);
            } else if (metadata.wobj.wobjects) {
                // parse post with list wobjects
            }
        }
    } else {                                //comment with parent_author is reply to post
        if (metadata && metadata.wobj) {
            if (metadata.wobj.field) {
                appendObjectParser.parse(operation, metadata);
            } else if (metadata.wobj.wobjects) {
                // parse reply to post with list wobjects
            }
        }
    }
};

module.exports = {parse};