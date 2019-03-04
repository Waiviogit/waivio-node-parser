const createObjectParser = require('./createObjectParser');
const appendObjectParser = require('./appendObjectParser');
const postWithObjectsParser = require('./postWithObjectParser');
const {postByTagsHelper} = require('../utilities/helpers');

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
                await createObjectParser.parse(operation, metadata);      //create wobject in database
            } else if (metadata.wobj.wobjects) {
                await postWithObjectsParser.parse(operation, metadata);             //create post with wobjects in database
            }
        } else if (metadata && metadata.tags) {
            const wobjects = await postByTagsHelper.wobjectsByTags(metadata.tags);
            if (wobjects && wobjects.length) {
                metadata.wobj = {
                    wobjects: wobjects.map(item => ({author_permlink: item, percent: 100, tagged: true}))
                };
                await postWithObjectsParser.parse(operation, metadata);
            }
        }
    } else {                                //comment with parent_author is reply to post
        if (metadata && metadata.wobj) {
            if (metadata.wobj.field) {
                await appendObjectParser.parse(operation, metadata);      //add field to wobject in database
            } else if (metadata.wobj.wobjects) {
                // #parse reply to post with list wobjects
            }
        }
    }
};

module.exports = {parse};