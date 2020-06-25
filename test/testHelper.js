const {
  Wobj: WobjModel, App: AppModel, ObjectType: ObjectTypeModel, Post: PostModel, User: UserModel, CommentModel,
  Subscriptions: SubscriptionModel,
} = require('models');
const wobjectOperations = require('utilities/tasks/appendWobjectFields/wobjectsOperations');
const chai = require('chai');
const sinonChai = require('sinon-chai');
const chaiAsPromised = require('chai-as-promised');

chai.use(chaiAsPromised);
chai.use(sinonChai);
const { expect } = chai;
const faker = require('faker');
const { Mongoose } = require('database');

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
  dropDatabase,
  CommentModel,
  WobjModel,
  PostModel,
  UserModel,
  AppModel,
  Mongoose,
  expect,
  faker,
  chai,
};
