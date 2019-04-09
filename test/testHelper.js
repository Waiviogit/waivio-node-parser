const {
    objectTypeParser,
    appendObjectParser,
    createObjectParser,
    commentParser,
    followObjectParser,
    mainParser,
    postWithObjectParser,
    voteParser
} = require('../parsers');
const {investarenaForecastHelper} = require('../utilities/helpers');
const {ObjectType, WObject, Post, User} = require('../database').models;
const chai = require('chai');
const expect = chai.expect;
const {Mongoose} = require('../database');
const {redis, redisGetter, redisSetter} = require('../utilities/redis');
const {importRsmqClient} = require('../utilities/redis/rsmq/index');
const redisQueue = require('../utilities/redis/rsmq/redisQueue');
const {importWobjectsDataClient} = require('../utilities/redis/redis');
const {createQueue, sendMessage, deleteMessage, receiveMessage} = require('../utilities/redis/rsmq/redisQueue');
const {importObjectsService} = require('../utilities/services');
const faker = require('faker');
const sinon = require('sinon');

const getRandomString = (length = 5) => {
    return faker.internet.password(length, false, /[a-z]/)
};

module.exports =
    {
        objectTypeParser,
        appendObjectParser,
        createObjectParser,
        commentParser,
        followObjectParser,
        mainParser,
        postWithObjectParser,
        voteParser,
        ObjectType,
        WObject,
        Post,
        User,
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
        importObjectsService,
        createQueue,
        sendMessage,
        deleteMessage,
        receiveMessage,
        importRsmqClient,
        importWobjectsDataClient,
        redisQueue
    };
