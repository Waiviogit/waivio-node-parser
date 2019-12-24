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
const { investarenaForecastHelper, voteFieldHelper, updateSpecificFieldsHelper, postHelper,
    votePostHelper, appHelper, postByTagsHelper, ratingHelper, detectPostLanguageHelper, wobjectHelper } = require( '../utilities/helpers' );
const { specifiedFieldsValidator, appendObjectValidator } = require( '../validator' );
const { postsUtil } = require( '../utilities/steemApi' );
const { importTags, importUpdates } = require( '../utilities/objectImportServiceApi' );
const { ObjectType, WObject, Post, User, UserWobjects, App, CommentRef } = require( '../database' ).models;
const { Wobj: WobjModel, App: AppModel, ObjectType: ObjectTypeModel, Post: PostModel, User: UserModel } = require( '../models' );
const sinon = require( 'sinon' );
const chai = require( 'chai' );
const sinonChai = require( 'sinon-chai' );
const chaiAsPromised = require( 'chai-as-promised' );
chai.use( sinonChai );
chai.use( chaiAsPromised );
const expect = chai.expect;
const { Mongoose } = require( '../database' );
const { redis, redisGetter, redisSetter } = require( '../utilities/redis' );
const { commentRefGetter, commentRefSetter } = require( '../utilities/commentRefService' );
const faker = require( 'faker' );
const wobjectOperations = require( '../utilities/tasks/appendWobjectFields/wobjectsOperations' );

const getRandomString = ( length = 5 ) => {
    return faker.internet.password( length, false, /[a-z]/ );
};
faker.random.string = getRandomString;

const dropDatabase = async () => {
    const { models } = require( '../database' );
    for( const model in models ) {
        await models[ model ].deleteMany();
    }
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
    wobjectOperations,
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
    CommentRef,
    appHelper,
    importTags,
    importUpdates,
    postByTagsHelper,
    ratingHelper,
    detectPostLanguageHelper,
    postHelper,
    wobjectHelper,
    AppModel,
    ObjectTypeModel,
    PostModel,
    UserModel,
    dropDatabase,
    commentRefGetter,
    commentRefSetter
};
