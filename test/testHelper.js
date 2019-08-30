const {
    objectTypeParser,
    appendObjectParser,
    createObjectParser,
    commentParser,
    followObjectParser,
    mainParser,
    postWithObjectParser,
    voteParser,
    userParsers
} = require( '../parsers' );
const { investarenaForecastHelper, voteFieldHelper, updateSpecificFieldsHelper, votePostHelper, appHelper, postByTagsHelper } = require( '../utilities/helpers' );
const { specifiedFieldsValidator, appendObjectValidator } = require( '../validator' );
const { postsUtil } = require( '../utilities/steemApi' );
const { importTags } = require( '../utilities/objectImportServiceApi' );
const { ObjectType, WObject, Post, User, UserWobjects, App } = require( '../database' ).models;
const { Wobj: WobjModel } = require( '../models' );
const chai = require( 'chai' );
const expect = chai.expect;
const { Mongoose } = require( '../database' );
const { redis, redisGetter, redisSetter } = require( '../utilities/redis' );
const faker = require( 'faker' );
const sinon = require( 'sinon' );

const getRandomString = ( length = 5 ) => {
    return faker.internet.password( length, false, /[a-z]/ );
};

module.exports = {
    objectTypeParser,
    appendObjectParser,
    createObjectParser,
    commentParser,
    followObjectParser,
    mainParser,
    postWithObjectParser,
    voteParser,
    userParsers,
    ObjectType,
    WObject,
    Post,
    User,
    UserWobjects,
    chai,
    expect,
    Mongoose,
    redis,
    redisSetter,
    redisGetter,
    faker,
    getRandomString,
    sinon,
    investarenaForecastHelper,
    voteFieldHelper,
    votePostHelper,
    postsUtil,
    updateSpecificFieldsHelper,
    specifiedFieldsValidator,
    appendObjectValidator,
    WobjModel,
    App,
    appHelper,
    importTags,
    postByTagsHelper
};
