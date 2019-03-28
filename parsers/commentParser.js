const createObjectParser = require('./createObjectParser');
const appendObjectParser = require('./appendObjectParser');
const postWithObjectsParser = require('./postWithObjectParser');
const {postByTagsHelper, investarenaForecastHelper} = require('../utilities/helpers');

const parse = async function (operation) {  //data is operation[1] of transaction in block
    let metadata;
    try {
        if (operation.json_metadata !== '') {
            metadata = JSON.parse(operation.json_metadata)          //parse json_metadata from string to JSON
        }
    } catch (e) {
        console.error(e)
    }
    if (operation.parent_author === '' && metadata) {   //comment without parent_author is post
        if (metadata.wobj) {        //case if user add wobjects when create post
            if (metadata.wobj.field) {
                await createObjectParser.parse(operation, metadata);      //create wobject in database
            } else if (metadata.wobj.wobjects) {
                if (metadata.tags) {
                    const tagWobjects = await postByTagsHelper.wobjectsByTags(metadata.tags);
                    if (tagWobjects && tagWobjects.length) {
                        metadata.wobj.wobjects = [...metadata.wobj.wobjects, ...tagWobjects];
                    }
                }
                await postWithObjectsParser.parse(operation, metadata);             //create post with wobjects in database
            }
        } else if (metadata.tags) { //case if post has wobjects from tags
            const wobjects = await postByTagsHelper.wobjectsByTags(metadata.tags);
            if (wobjects && wobjects.length) {
                metadata.wobj = {wobjects};
                await postWithObjectsParser.parse(operation, metadata);
            }
        }
        if (metadata.wia) {
            await investarenaForecastHelper.updatePostWithForecast({
                author: operation.author,
                permlink: operation.permlink,
                forecast: metadata.wia
            });     //add forecast to post(for wtrade)
        }
    } else {                                //comment with parent_author is reply to post
        if (metadata && metadata.wobj) {
            if (metadata.wobj.field) {
                await appendObjectParser.parse(operation, metadata);      //add field to wobject in database
            } else if (metadata.wobj.wobjects) {
                // #parse reply to post with list wobjects
            }
        }

        if (metadata.wia && metadata.wia.exp_forecast) {
            await investarenaForecastHelper.updatePostWithExpForecast({
                parent_author: operation.parent_author,
                parent_permlink: operation.parent_permlink,
                author: operation.author,
                exp_forecast: metadata.wia.exp_forecast
            });     //add expired forecast to post(for wtrade)
        }
    }
};

module.exports = {parse};