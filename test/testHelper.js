const {
  Wobj: WobjModel, App: AppModel, ObjectType: ObjectTypeModel, Post: PostModel, User: UserModel, CommentModel,
  Subscriptions: SubscriptionModel, Campaign: CampaignModel,
} = require('models');
const wobjectOperations = require('utilities/tasks/appendWobjectFields/wobjectsOperations');
const chai = require('chai');
const { ObjectID } = require('bson');
const sinonChai = require('sinon-chai');
const chaiAsPromised = require('chai-as-promised');

chai.use(chaiAsPromised);
chai.use(sinonChai);
const { expect } = chai;
const faker = require('faker');
const { Mongoose } = require('database');
const config = require('config');
const moment = require('moment');

faker.random.string = (length = 5) => faker.internet.password(length, false, /[a-z]/);

const dropDatabase = async () => {
  const { models } = require('../database');
  for (const model in models) {
    await models[model].deleteMany();
  }
};

module.exports = {
  ...require('utilities/objectImportServiceApi'),
  ...require('utilities/commentRefService'),
  ...require('utilities/restaurantTagsParser'),
  ...require('utilities/waivioApi'),
  ...require('utilities/steemApi'),
  ...require('utilities/helpers'),
  ...require('database').models,
  ...require('utilities/redis'),
  ...require('validator'),
  ...require('parsers'),
  sinon: require('sinon'),
  wobjectOperations,
  SubscriptionModel,
  ObjectTypeModel,
  CampaignModel,
  ObjectID,
  dropDatabase,
  CommentModel,
  WobjModel,
  PostModel,
  UserModel,
  AppModel,
  Mongoose,
  expect,
  moment,
  config,
  faker,
  chai,
};
