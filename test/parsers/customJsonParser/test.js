const _ = require('lodash');
const moment = require('moment');
const {
  faker, expect, customJsonParser, User, config, dropDatabase,
} = require('test/testHelper');
const { AppFactory, UserFactory } = require('test/factories');
const { REFERRAL_TYPES } = require('constants/appData');
const { getCustomJsonData } = require('./mocks');

describe('On custom json parser', async () => {
  describe('On referral program', async () => {
    let blackListUser, duration, botName;
    beforeEach(async () => {
      await dropDatabase();
      botName = faker.random.string();
      duration = _.random(10, 50);
      blackListUser = faker.random.string(10);
      await AppFactory.Create({
        bots: [{ name: botName, postingKey: faker.random.string(), roles: ['proxyBot'] }],
        name: config.app,
        referralsData: [{ type: REFERRAL_TYPES.REVIEWS, duration }],
        blackListUsers: [blackListUser],
      });
    });
    describe('On ok', async () => {
      describe('On real users', () => {
        let mockData, agent, author, result;
        beforeEach(async () => {
          ({ user: agent } = await UserFactory.Create());
          ({ user: author } = await UserFactory.Create());
          const json = { agent: agent.name, type: REFERRAL_TYPES.REVIEWS };
          mockData = getCustomJsonData(
            { json: JSON.stringify(json), id: 'add_referral_agent', postingAuth: [author.name] },
          );
          await customJsonParser.parse(mockData);
          result = await User.findOne({ name: author.name });
        });
        it('should add correct agent to user new user', async () => {
          const referralsData = _.find(result.referral, { type: REFERRAL_TYPES.REVIEWS });
          expect(referralsData.agent).to.be.eq(agent.name);
        });
        it('should add correct count of days to referral', async () => {
          const referralsData = _.find(result.referral, { type: REFERRAL_TYPES.REVIEWS });
          const days = moment.utc(referralsData.endedAt).get('dayOfYear') - moment.utc(referralsData.startedAt).get('dayOfYear');
          expect(days).to.be.eq(duration);
        });
      });
      describe('On guest users', () => {
        let mockData, agent, author, referralsData;
        beforeEach(async () => {
          ({ user: agent } = await UserFactory.Create());
          ({ user: author } = await UserFactory.Create());
          const json = { agent: agent.name, type: REFERRAL_TYPES.REVIEWS, guestName: author.name };
          mockData = getCustomJsonData(
            { json: JSON.stringify(json), id: 'add_referral_agent', postingAuth: [botName] },
          );
          await customJsonParser.parse(mockData);
          const result = await User.findOne({ name: author.name });
          referralsData = _.find(result.referral, { type: REFERRAL_TYPES.REVIEWS });
        });
        it('should add correct agent to user new user', async () => {
          expect(referralsData.agent).to.be.eq(agent.name);
        });
        it('should add correct count of days to referral', async () => {
          const days = moment.utc(referralsData.endedAt).get('dayOfYear') - moment.utc(referralsData.startedAt).get('dayOfYear');
          expect(days).to.be.eq(duration);
        });
      });
    });

    describe('On errors', async () => {
      describe('On agent in blacklist', async () => {
        let mockData, agent, author, result;
        beforeEach(async () => {
          ({ user: author } = await UserFactory.Create());
          ({ user: agent } = await UserFactory.Create({ name: blackListUser }));
          const json = { agent: agent.name, type: REFERRAL_TYPES.REVIEWS };
          mockData = getCustomJsonData(
            { json: JSON.stringify(json), id: 'add_referral_agent', postingAuth: [author.name] },
          );
          await customJsonParser.parse(mockData);
          result = await User.findOne({ name: author.name });
        });
        it('should not add referral if agent in blacklist', async () => {
          expect(result.referral).to.be.empty;
        });
      });
      describe('On invalid data in json', async () => {
        let mockData, author, result;
        beforeEach(async () => {
          ({ user: author } = await UserFactory.Create());
          const json = { type: REFERRAL_TYPES.REVIEWS };
          mockData = getCustomJsonData(
            { json: JSON.stringify(json), id: 'add_referral_agent', postingAuth: [author.name] },
          );
          await customJsonParser.parse(mockData);
          result = await User.findOne({ name: author.name });
        });
        it('should not add referral if agent in blacklist', async () => {
          expect(result.referral).to.be.empty;
        });
      });
      describe('On invalid bot with guest user', async () => {
        let mockData, author, result, agent;
        beforeEach(async () => {
          ({ user: author } = await UserFactory.Create());
          ({ user: agent } = await UserFactory.Create({ name: blackListUser }));

          const json = { agent: agent.name, type: REFERRAL_TYPES.REVIEWS, guestName: author.name };
          mockData = getCustomJsonData(
            { json: JSON.stringify(json), id: 'add_referral_agent', postingAuth: [faker.name.firstName()] },
          );
          await customJsonParser.parse(mockData);
          result = await User.findOne({ name: author.name });
        });
        it('should not add referral if agent in blacklist', async () => {
          expect(result.referral).to.be.empty;
        });
      });
      describe('On one of users not exist in DB', async () => {
        let mockData, author, result;
        beforeEach(async () => {
          ({ user: author } = await UserFactory.Create());
          const json = {
            agent: faker.random.string(),
            type: REFERRAL_TYPES.REVIEWS,
            guestName: author.name,
          };
          mockData = getCustomJsonData(
            { json: JSON.stringify(json), id: 'add_referral_agent', postingAuth: [faker.name.firstName()] },
          );
          await customJsonParser.parse(mockData);
          result = await User.findOne({ name: author.name });
        });
        it('should not add referral if agent in blacklist', async () => {
          expect(result.referral).to.be.empty;
        });
      });
      describe('Referrals in user not empty', async () => {
        let mockData, author, result, agent;
        beforeEach(async () => {
          ({ user: author } = await UserFactory.Create(
            { referral: { type: REFERRAL_TYPES.REVIEWS } },
          ));
          ({ user: agent } = await UserFactory.Create());

          const json = { agent: agent.name, type: REFERRAL_TYPES.REVIEWS, guestName: author.name };
          mockData = getCustomJsonData(
            { json: JSON.stringify(json), id: 'add_referral_agent', postingAuth: [faker.name.firstName()] },
          );
          await customJsonParser.parse(mockData);
          result = await User.findOne({ name: author.name });
        });
        it('should not add referral if agent in blacklist', async () => {
          expect(result.referral).to.have.length(1);
        });
      });
    });
  });
});
