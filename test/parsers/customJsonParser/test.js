const _ = require('lodash');
const moment = require('moment');
const {
  faker, expect, customJsonParser, User, config, dropDatabase,
} = require('test/testHelper');
const { AppFactory, UserFactory } = require('test/factories');
const { REFERRAL_TYPES, REFERRAL_STATUSES } = require('constants/appData');
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
        host: config.appHost,
        referralsData: [{ type: REFERRAL_TYPES.REVIEWS, duration }],
        blackListUsers: [blackListUser],
      });
    });
    describe('On ok', async () => {
      describe('On real users', () => {
        let mockData, agent, author, result;
        beforeEach(async () => {
          ({ user: agent } = await UserFactory.Create({ allowReferral: true }));
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
          const days = moment.utc(referralsData.endedAt).diff(moment.utc(referralsData.startedAt), 'days');
          expect(days).to.be.eq(duration);
        });
      });
      describe('On guest users', () => {
        let mockData, agent, author, referralsData;
        beforeEach(async () => {
          ({ user: agent } = await UserFactory.Create({ allowReferral: true }));
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
          const days = moment.utc(referralsData.endedAt).diff(moment.utc(referralsData.startedAt), 'days');
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

      describe('Agent not allow referral', async () => {
        let mockData, author, result, agent;
        beforeEach(async () => {
          ({ user: author } = await UserFactory.Create());
          ({ user: agent } = await UserFactory.Create(
            { referralStatus: REFERRAL_STATUSES.REJECTED },
          ));

          const json = { agent: agent.name, type: REFERRAL_TYPES.REVIEWS };
          mockData = getCustomJsonData(
            { json: JSON.stringify(json), id: 'add_referral_agent', postingAuth: [author.name] },
          );
          await customJsonParser.parse(mockData);
          result = await User.findOne({ name: author.name });
        });
        it('should not add referral if agent not allow referral', async () => {
          expect(result.referral).to.have.length(0);
        });
      });
    });
  });
  describe('On confirm_referral_license', async () => {
    let agent, mockData;
    beforeEach(async () => {
      await dropDatabase();
      ({ user: agent } = await UserFactory.Create());
      const json = { agent: agent.name };
      mockData = getCustomJsonData(
        { json: JSON.stringify(json), id: 'confirm_referral_license', postingAuth: [agent.name] },
      );
    });
    it('should change user referral status to active', async () => {
      await customJsonParser.parse(mockData);
      const result = await User.findOne({ name: agent.name }).lean();
      expect(result.referralStatus).to.be.eq(REFERRAL_STATUSES.ACTIVATED);
    });
    it('should not change status if names not match', async () => {
      mockData.required_posting_auths = [faker.random.string()];
      await customJsonParser.parse(mockData);
      const result = await User.findOne({ name: agent.name }).lean();
      expect(result.referralStatus).to.be.eq(REFERRAL_STATUSES.NOT_ACTIVATED);
    });
  });
  describe('On reject_referral_license', async () => {
    let agent, mockData, user;
    beforeEach(async () => {
      await dropDatabase();
      ({ user: agent } = await UserFactory.Create({ referralStatus: REFERRAL_STATUSES.ACTIVATED }));
      const usersCount = _.random(2, 10);
      for (let counter = 0; counter < usersCount; counter++) {
        ({ user } = await UserFactory.Create({
          referral: [{
            agent: faker.name.firstName(),
            endedAt: moment.utc().add(20, 'days').toDate(),
            type: REFERRAL_TYPES.INVITE_FRIEND,
          }, {
            agent: agent.name,
            endedAt: moment.utc().add(20, 'days').toDate(),
            type: REFERRAL_TYPES.REVIEWS,
          }],
        }));
      }
      const json = { agent: agent.name };
      mockData = getCustomJsonData(
        { json: JSON.stringify(json), id: 'reject_referral_license', postingAuth: [agent.name] },
      );
    });
    it('should change user referral status to rejected', async () => {
      await customJsonParser.parse(mockData);
      const result = await User.findOne({ name: agent.name });
      expect(result.referralStatus).to.be.eq(REFERRAL_STATUSES.REJECTED);
    });
    it('should change end time of all agent referrals', async () => {
      await customJsonParser.parse(mockData);
      const users = await User.find({ 'referral.agent': agent.name }).lean();
      const result = _.uniq(_.map(users, (usr) => {
        const referral = _.find(usr.referral, { agent: agent.name });
        return referral.endedAt.valueOf();
      }));
      expect(result).to.have.length(1);
    });
    it('should set correct time', async () => {
      await customJsonParser.parse(mockData);
      const users = await User.find({ 'referral.agent': agent.name }).lean();
      const result = _.uniq(_.map(users, (usr) => {
        const referral = _.find(usr.referral, { agent: agent.name });
        return referral.endedAt.valueOf();
      }));
      expect(Math.round(result / 1000)).to.be.eq(Math.round(moment.utc().valueOf() / 1000));
    });
    it('should not change time if referral already end', async () => {
      const newDate = moment.utc().subtract(2, 'days').toDate();
      await User.updateOne({
        name: user.name,
        referral: { $elemMatch: { agent: agent.name, endedAt: { $gt: moment.utc().toDate() } } },
      }, { $set: { 'referral.$.endedAt': newDate } });
      const updatedUser = await User.findOne({ name: user.name }).lean();
      const result = _.find(updatedUser.referral, { agent: agent.name });
      expect(result.endedAt).to.be.deep.eq(newDate);
    });
    it('should not update another referrals', async () => {
      await customJsonParser.parse(mockData);
      const users = await User.find({ 'referral.agent': agent.name }).lean();
      const result = _.uniq(_.map(users, (usr) => {
        const referral = _.find(usr.referral, (referral) => referral.agent !== agent.name);
        return referral.endedAt.valueOf();
      }));
      expect(Math.round(result / 1000)).to.be.not.eq(Math.round(moment.utc().valueOf() / 1000));
    });
  });
});
