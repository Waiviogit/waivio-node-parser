const _ = require('lodash');
const moment = require('moment');
const {
  expect, faker, dropDatabase, sitesHelper, App, sinon, AppModel, WebsitePayments, config,
  WebsitesRefund, objectBotsValidator, Post, MutedUser,
} = require('test/testHelper');
const {
  STATUSES, FEE, TRANSFER_ID, REFUND_ID, PAYMENT_TYPES, REFUND_STATUSES, PATH,
} = require('constants/sitesData');
const { MUTE_ACTION } = require('constants/parsersData');
const {
  AppFactory, WebsitePaymentsFactory, WebsiteRefundsFactory, PostFactory, MutedUsersFactory,
} = require('test/factories');
const {
  settingsData, authorityData, mutedData, setReferral,
} = require('./mocks');

describe('On sitesHelper', async () => {
  let author, app;
  beforeEach(async () => {
    await dropDatabase();
    author = faker.name.firstName();
    app = await AppFactory.Create({ owner: author });
  });
  afterEach(() => {
    sinon.restore();
  });
  describe('On create/delete', async () => {
    let parent, owner, name, botName;
    beforeEach(async () => {
      botName = faker.random.string();
      owner = faker.random.string();
      name = faker.random.string();
      await dropDatabase();
      await AppFactory.Create({
        host: config.appHost, canBeExtended: true, inherited: false, bots: [{ name: botName, postingKey: faker.random.string(), roles: ['serviceBot'] }],
      });
      parent = await AppFactory.Create({ canBeExtended: true, inherited: false });
    });
    describe('On create', async () => {
      let operation;
      beforeEach(async () => {
        operation = {
          required_posting_auths: [botName],
          json: JSON.stringify({
            owner, name, host: `${name}.${parent.host}`, parentHost: parent.host,
          }),
        };
      });
      it('should create app with correct inherited and canBeExtended flags', async () => {
        await sitesHelper.createWebsite(operation);
        const myApp = await App.findOne({ host: `${name}.${parent.host}` });
        expect(myApp.inherited && !myApp.canBeExtended).to.be.true;
      });
      it('should create app with correct parent id', async () => {
        await sitesHelper.createWebsite(operation);
        const myApp = await App.findOne({ host: `${name}.${parent.host}` });
        expect(myApp.parent.toString()).to.be.eq(parent._id.toString());
      });
      it('should add to app parent configuration', async () => {
        await sitesHelper.createWebsite(operation);
        const myApp = await App.findOne({ host: `${name}.${parent.host}` });
        expect(myApp.configuration.configurationFields)
          .to.be.deep.eq(parent.configuration.configurationFields);
      });
      it('should add to app parent ', async () => {
        await sitesHelper.createWebsite(operation);
        const myApp = await App.findOne({ host: `${name}.${parent.host}` });
        expect(myApp.supported_object_types)
          .to.be.deep.eq(parent.supported_object_types);
      });
      it('should not create app with another user in posting auth', async () => {
        operation.required_posting_auths = [faker.random.string()];
        await sitesHelper.createWebsite(operation);
        const myApp = await App.findOne({ host: `${name}.${parent.host}` });
        expect(myApp).to.be.null;
      });
    });
    describe('On delete', async () => {
      let operation, myApp;
      beforeEach(async () => {
        myApp = await AppFactory.Create({
          parent: parent._id, owner, name, host: `${name}.${parent.host}`,
        });
        operation = {
          required_posting_auths: [botName],
          json: JSON.stringify({ userName: owner, host: `${name}.${parent.host}` }),
        };
      });
      it('should successfully delete website ', async () => {
        await sitesHelper.deleteWebsite(operation);
        const result = await App.findOne({ host: myApp.host });
        expect(result).to.be.null;
      });
      it('should not delete if site has not pending status', async () => {
        await App.updateOne({ _id: myApp._id }, { status: STATUSES.ACTIVE });
        await sitesHelper.deleteWebsite(operation);
        const result = await App.findOne({ host: myApp.host });
        expect(result).to.be.exist;
      });
    });
  });

  describe('On activationActions', async () => {
    let operation;
    beforeEach(async () => {
      operation = {
        required_posting_auths: [author],
        json: JSON.stringify({ host: app.host }),
      };
    });

    describe('on Activate', async () => {
      it('should activate site with valid operation', async () => {
        await sitesHelper.activationActions(operation, true);
        const result = await App.findOne({ _id: app._id }).lean();
        expect(result.status !== app.status && result.status === STATUSES.ACTIVE).to.be.true;
      });
      it('should not activate with invalid author in json', async () => {
        operation.required_posting_auths = [faker.random.string(10)];
        await sitesHelper.activationActions(operation, true);
        const result = await App.findOne({ _id: app._id }).lean();
        expect(result.status === app.status && result.status === STATUSES.PENDING).to.be.true;
      });
      it('should exit from method if author is missing', async () => {
        operation.required_posting_auths = [];
        sinon.spy(AppModel, 'findOne');
        await sitesHelper.activationActions(operation, true);
        expect(AppModel.findOne.notCalled).to.be.true;
      });
      it('should set activatedAt field with activation', async () => {
        await sitesHelper.activationActions(operation, true);
        const result = await App.findOne({ _id: app._id }).lean();
        expect(result.activatedAt).to.be.not.null;
      });
      it('should not activate if site deactivated > 6 month ago', async () => {
        await App.updateOne({ _id: app._id }, { deactivatedAt: moment.utc().subtract(7, 'month'), status: STATUSES.INACTIVE });
        await sitesHelper.activationActions(operation, true);
        const result = await App.findOne({ _id: app._id }).lean();
        expect(result.status).to.be.eq(STATUSES.INACTIVE);
      });
    });

    describe('on Deactivate', async () => {
      beforeEach(async () => {
        app = await App.findOneAndUpdate({ _id: app.id }, { status: STATUSES.ACTIVE }, { new: true });
      });
      it('should deactivate site with valid operation', async () => {
        await sitesHelper.activationActions(operation, false);
        const result = await App.findOne({ _id: app._id }).lean();
        expect(result.status !== app.status && result.status === STATUSES.INACTIVE).to.be.true;
      });
      it('should not deactivate with invalid author in json', async () => {
        operation.required_posting_auths = [faker.random.string(10)];
        await sitesHelper.activationActions(operation, false);
        const result = await App.findOne({ _id: app._id }).lean();
        expect(result.status === app.status && result.status === STATUSES.ACTIVE).to.be.true;
      });
      it('should set activatedAt field with activation', async () => {
        await sitesHelper.activationActions(operation, false);
        const result = await App.findOne({ _id: app._id }).lean();
        expect(result.deactivatedAt).to.be.not.null;
      });
      it('should exit from method if author is missing', async () => {
        operation.required_posting_auths = [];
        sinon.spy(AppModel, 'findOne');
        await sitesHelper.activationActions(operation, false);
        expect(AppModel.findOne.notCalled).to.be.true;
      });
    });
  });

  describe('On saveWebsiteSettings', async () => {
    let operation, beneficiary, percent;
    beforeEach(async () => {
      percent = _.random(1000, 5000);
      beneficiary = {
        account: author,
        percent,
      };
      operation = settingsData({ author, appId: app._id, beneficiary });
    });
    it('should update settings with correct data', async () => {
      await sitesHelper.saveWebsiteSettings(operation);
      const result = await App.findOne({ _id: app._id }).lean();
      expect(beneficiary).to.deep.eq(result.beneficiary);
    });
    it('should not update with without account in beneficiary', async () => {
      operation = settingsData({ author, appId: app._id, beneficiary: { percent } });
      await sitesHelper.saveWebsiteSettings(operation);
      const result = await App.findOne({ _id: app._id }).lean();
      expect(beneficiary).to.not.deep.eq(result.beneficiary);
    });
    it('should not call update method with without account in beneficiary', async () => {
      operation = settingsData({ author, appId: app._id, beneficiary: { percent } });
      sinon.spy(AppModel, 'updateOne');
      await sitesHelper.saveWebsiteSettings(operation);
      expect(AppModel.updateOne.notCalled).to.be.true;
    });
    it('should update googleId without beneficiary', async () => {
      const googleAnalyticsTag = faker.random.string();
      operation = settingsData({ author, appId: app._id, googleAnalyticsTag });
      await sitesHelper.saveWebsiteSettings(operation);
      const result = await App.findOne({ _id: app._id }).lean();
      expect(googleAnalyticsTag).to.be.eq(result.googleAnalyticsTag);
    });
    it('should not update app if author of transaction not owner of site', async () => {
      operation = settingsData({ appId: app._id, beneficiary });
      await sitesHelper.saveWebsiteSettings(operation);
      const result = await App.findOne({ _id: app._id }).lean();
      expect(beneficiary).to.be.not.deep.eq(result.beneficiary);
    });
  });

  describe('On websiteAuthorities', async () => {
    let operation, authority;
    beforeEach(async () => {
      authority = faker.name.firstName();
      operation = authorityData({ author, host: app.host, names: [authority] });
    });
    describe('On add', async () => {
      it('should add moderators with correct data', async () => {
        await sitesHelper.websiteAuthorities(operation, 'moderators', true);
        const result = await App.findOne({ _id: app._id }).lean();
        expect(result.moderators).to.contains(authority);
      });
      it('should add administrators with correct data', async () => {
        await sitesHelper.websiteAuthorities(operation, 'admins', true);
        const result = await App.findOne({ _id: app._id }).lean();
        expect(result.admins).to.contains(authority);
      });
      it('should add authorities with correct data', async () => {
        await sitesHelper.websiteAuthorities(operation, 'authority', true);
        const result = await App.findOne({ _id: app._id }).lean();
        expect(result.authority).to.contains(authority);
      });
      it('should not call update method with empty names array', async () => {
        operation = authorityData({ author, appId: app._id, names: [] });
        sinon.spy(AppModel, 'updateOne');
        await sitesHelper.websiteAuthorities(operation, 'authority', true);
        expect(AppModel.updateOne.notCalled).to.be.true;
      });
      it('should not update app with another posting authority', async () => {
        operation = authorityData({ appId: app._id, names: [authority] });
        await sitesHelper.websiteAuthorities(operation, 'authority', true);
        const result = await App.findOne({ _id: app._id }).lean();
        expect(result.authority).to.not.contains(authority);
      });
    });

    describe('On remove', async () => {
      beforeEach(async () => {
        await App.updateOne({ _id: app._id }, {
          $addToSet: { admins: authority, authority, moderators: authority },
        });
      });
      it('should pull admin from app with correct data', async () => {
        await sitesHelper.websiteAuthorities(operation, 'admins', false);
        const result = await App.findOne({ _id: app._id }).lean();
        expect(result.admins).to.not.contains(authority);
      });
      it('should pull moderator from app with correct data', async () => {
        await sitesHelper.websiteAuthorities(operation, 'moderators', false);
        const result = await App.findOne({ _id: app._id }).lean();
        expect(result.moderators).to.not.contains(authority);
      });
      it('should pull authority from app with correct data', async () => {
        await sitesHelper.websiteAuthorities(operation, 'authority', false);
        const result = await App.findOne({ _id: app._id }).lean();
        expect(result.authority).to.not.contains(authority);
      });
      it('should not call update method with empty names array', async () => {
        operation = authorityData({ author, appId: app._id, names: [] });
        sinon.spy(AppModel, 'updateOne');
        await sitesHelper.websiteAuthorities(operation, 'authority', false);
        expect(AppModel.updateOne.notCalled).to.be.true;
      });
    });
  });

  describe('On parseSitePayments', async () => {
    let operation;
    beforeEach(async () => {
      await dropDatabase();
      operation = {
        to: FEE.account,
        from: faker.name.firstName(),
        amount: `${_.random(10, 20)} ${FEE.currency}`,
      };
    });
    it('should create transfer record with correct operation data', async () => {
      await sitesHelper.parseSitePayments(
        { operation, blockNum: _.random(100, 1000), type: TRANSFER_ID },
      );
      const result = await WebsitePayments.findOne(
        { userName: operation.from, type: PAYMENT_TYPES.TRANSFER },
      ).lean();
      expect(_.pick(result, ['userName', 'type', 'amount'])).to.be.deep.eq({
        userName: operation.from, amount: parseFloat(operation.amount), type: PAYMENT_TYPES.TRANSFER,
      });
    });
    it('should create refund record with correct operation data ', async () => {
      operation.to = faker.random.string();
      await sitesHelper.parseSitePayments(
        { operation, blockNum: _.random(100, 1000), type: REFUND_ID },
      );
      const result = await WebsitePayments.findOne(
        { userName: operation.to, type: PAYMENT_TYPES.REFUND },
      ).lean();
      expect(_.pick(result, ['userName', 'type', 'amount'])).to.be.deep.eq({
        userName: operation.to, amount: parseFloat(operation.amount), type: PAYMENT_TYPES.REFUND,
      });
    });
    it('should not create record with incorrect receiver with type transfer', async () => {
      operation.to = faker.random.string();
      await sitesHelper.parseSitePayments(
        { operation, blockNum: _.random(100, 1000), type: TRANSFER_ID },
      );
      const result = await WebsitePayments.findOne(
        { userName: operation.from, type: PAYMENT_TYPES.TRANSFER },
      ).lean();
      expect(result).to.be.null;
    });
    it('should not create record with another currency', async () => {
      operation.amount = `${_.random(10, 20)} ${faker.random.string()}`;
      await sitesHelper.parseSitePayments(
        { operation, blockNum: _.random(100, 1000), type: TRANSFER_ID },
      );
      const result = await WebsitePayments.findOne(
        { userName: operation.from, type: PAYMENT_TYPES.TRANSFER },
      ).lean();
      expect(result).to.be.null;
    });
  });

  describe('On refundRequest', async () => {
    let account, amount;
    beforeEach(async () => {
      amount = _.random(50, 100);
      account = faker.name.firstName();
      await WebsitePaymentsFactory.Create({ name: account, amount });
    });
    describe('On OK', async () => {
      let operation;
      beforeEach(async () => {
        operation = {
          required_posting_auths: [account],
          json: JSON.stringify({ userName: account }),
        };
      });
      it('should return true with correct params', async () => {
        const result = await sitesHelper.refundRequest(operation, _.random(50, 100));
        expect(result).to.be.true;
      });
      it('should create refund record with refund amount < balance', async () => {
        await sitesHelper.refundRequest(operation, _.random(50, 100));
        const dbRecord = await WebsitesRefund.findOne(
          { userName: account, status: REFUND_STATUSES.PENDING },
        );
        expect(dbRecord).to.be.exist;
      });
    });
    describe('On errors', async () => {
      let operation;
      beforeEach(async () => {
        operation = {
          required_posting_auths: [account],
          json: JSON.stringify({ userName: account }),
        };
      });
      it('should return false if another pending refund is exists', async () => {
        await WebsiteRefundsFactory.Create({ name: account });
        const result = await sitesHelper.refundRequest(operation, _.random(50, 100));
        expect(result).to.be.false;
      });
      it('should not create record with another pending refund ', async () => {
        await WebsiteRefundsFactory.Create({ name: account });
        await sitesHelper.refundRequest(operation, _.random(50, 100));
        const dbRecords = await WebsitesRefund.find(
          { userName: account, status: REFUND_STATUSES.PENDING },
        );
        expect(dbRecords).to.have.length(1);
      });
      it('should return false if user has negative balance', async () => {
        await WebsitePaymentsFactory.Create(
          { name: account, amount: amount + 10, type: PAYMENT_TYPES.WRITE_OFF },
        );
        const result = await sitesHelper.refundRequest(operation, _.random(50, 100));
        expect(result).to.be.false;
      });
      it('should not create record if user has negative balance', async () => {
        await WebsitePaymentsFactory.Create(
          { name: account, amount: amount + 10, type: PAYMENT_TYPES.WRITE_OFF },
        );
        await sitesHelper.refundRequest(operation, _.random(50, 100));
        const dbRecords = await WebsitesRefund.find(
          { userName: account, status: REFUND_STATUSES.PENDING },
        );
        expect(dbRecords).to.have.length(0);
      });
    });
  });

  describe('On createInvoice', async () => {
    let operation, userName, amount, host;
    beforeEach(async () => {
      host = faker.internet.domainName();
      sinon.stub(objectBotsValidator, 'validate').returns(Promise.resolve(true));
      userName = faker.random.string();
      await AppFactory.Create({ host, owner: userName });
      amount = _.random(1, 10);
      await WebsitePaymentsFactory.Create({ amount, name: userName });
      operation = {
        required_posting_auths: [userName],
        json: JSON.stringify({
          userName, amount, host, countUsers: 0,
        }),
      };
    });
    it('should create db record with correct data in params', async () => {
      await sitesHelper.createInvoice(operation, _.random(10, 111));
      const result = await WebsitePayments.findOne(
        { userName, type: PAYMENT_TYPES.WRITE_OFF, amount },
      );
      expect(result).to.be.exist;
    });
    it('should return false with validation errors', async () => {
      operation.json = JSON.stringify({ userName, amount, countUsers: 0 });
      const result = await sitesHelper.createInvoice(operation, _.random(10, 111));
      expect(result).to.be.false;
    });
    it('should not create record with not correct data', async () => {
      operation.json = JSON.stringify({ userName, amount, countUsers: 0 });
      await sitesHelper.createInvoice(operation, _.random(10, 111));
      const result = await WebsitePayments.findOne(
        { userName, type: PAYMENT_TYPES.WRITE_OFF, amount },
      );
      expect(result).to.be.not.exist;
    });
    it('should not change status if payable >= debt', async () => {
      await sitesHelper.createInvoice(operation, _.random(10, 111));
      const result = await App.findOne({ host });
      expect(result.status).to.be.eq(STATUSES.PENDING);
    });
    it('should change site status with amount > payable', async () => {
      await WebsitePaymentsFactory.Create(
        { amount: 1, name: userName, type: PAYMENT_TYPES.WRITE_OFF },
      );
      await sitesHelper.createInvoice(operation, _.random(10, 111));
      const result = await App.findOne({ host });
      expect(result.status).to.be.eq(STATUSES.SUSPENDED);
    });
  });

  describe('on mutedUsers', async () => {
    let operation, apps, mutedUsers;
    const moderator = faker.random.string();
    const secondModer = faker.random.string();
    beforeEach(async () => {
      await dropDatabase();
      for (let i = 0; i < _.random(1, 3); i++) {
        await AppFactory.Create({ moderators: [moderator, secondModer] });
      }
      apps = await App.find({ moderators: moderator }).lean();
      mutedUsers = [faker.random.string(), faker.random.string(), faker.random.string()];
    });
    describe('on error', async () => {
      beforeEach(async () => {
        sinon.spy(console, 'error');
        sinon.spy(sitesHelper, 'mutedUsers');
      });
      afterEach(() => {
        sinon.restore();
      });
      it('should return console.error when not valid action ', async () => {
        operation = mutedData({ follower: moderator, action: faker.random.string() });
        await sitesHelper.mutedUsers(operation);
        expect(console.error).to.be.calledOnceWith('"action" must be one of [mute, unmute, updateHostList]');
      });
      it('should return console.error when not valid required_posting_auths ', async () => {
        operation = mutedData({ follower: faker.random.number() });

        await sitesHelper.mutedUsers(operation);
        expect(console.error).to.be.calledOnceWith('"mutedBy" must be a string');
      });
    });
    describe('on ok', async () => {
      describe('on mute users by administration', async () => {
        beforeEach(async () => {
          beforeEach(async () => {
            for (let i = 0; i < _.random(5, 10); i++) {
              await PostFactory.Create({ author: _.sample(mutedUsers) });
            }
            for (let i = 0; i < _.random(5, 10); i++) {
              await PostFactory.Create({ permlink: `${_.sample(mutedUsers)}/${faker.random.string()}` });
            }
          });
          mutedUsers.push(secondModer);
          operation = mutedData({
            follower: moderator,
            following: mutedUsers,
            action: MUTE_ACTION.MUTE,
          });
          await sitesHelper.mutedUsers(operation);
        });
        it('should all posts be blocked', async () => {
          const posts = await Post.find().lean();
          _.forEach(posts, (post) => {
            expect(post.blocked_for_apps).to.be.deep.eq(_.map(apps, 'host'));
          });
        });
        it('should create records in muted_users collection', async () => {
          const recordsWithoutSecondModer = _.filter(mutedUsers, (el) => el !== secondModer);
          const records = await MutedUser.find({ userName: { $in: recordsWithoutSecondModer } }).lean();
          _.forEach(records, (record) => {
            expect(_.omit(record, ['_id', 'userName'])).to.be.deep.eq({ mutedBy: moderator, mutedForApps: _.map(apps, 'host') });
          });
        });
        it('should not mute second moder', async () => {
          const record = await MutedUser.findOne({ userName: secondModer }).lean();
          expect(record.mutedForApps).to.be.an('array').that.is.empty;
        });
      });
      describe('on unmute by administration', async () => {
        beforeEach(async () => {
          for (let i = 0; i < _.random(5, 10); i++) {
            await PostFactory.Create({ author: _.sample(mutedUsers), blocked_for_apps: _.map(apps, 'host') });
          }
          for (let i = 0; i < _.random(5, 10); i++) {
            await PostFactory.Create({
              permlink: `${_.sample(mutedUsers)}/${faker.random.string()}`,
              blocked_for_apps: _.map(apps, 'host'),
            });
          }
          operation = mutedData({
            follower: moderator,
            following: mutedUsers,
            action: MUTE_ACTION.UNMUTE,
          });
          for (const mutedUser of mutedUsers) {
            await MutedUsersFactory.Create({
              userName: mutedUser,
              mutedBy: moderator,
              mutedForApps: _.map(apps, 'host'),
            });
          }
        });
        describe('on unmute users with single moderator', async () => {
          beforeEach(async () => {
            await sitesHelper.mutedUsers(operation);
          });
          it('should all posts be unblocked', async () => {
            const posts = await Post.find().lean();
            _.forEach(posts, (post) => {
              expect(post.blocked_for_apps).to.be.an('array').that.is.empty;
            });
          });
          it('should remove records in muted_users collection', async () => {
            const records = await MutedUser.find({ userName: { $in: mutedUsers } }).lean();
            expect(records).to.be.an('array').that.is.empty;
          });
        });
        describe('on unmute users when few moderators have same muted user', async () => {
          beforeEach(async () => {
            await MutedUsersFactory.Create({
              userName: mutedUsers[0],
              mutedBy: secondModer,
              mutedForApps: _.map(apps, 'host'),
            });
            await sitesHelper.mutedUsers(operation);
          });
          it('should not unmute user if muted by other moderator on app (post collection)', async () => {
            const posts = await Post.find({ $or: [{ author: mutedUsers[0] }, { permlink: { $regex: new RegExp(`^${mutedUsers[0]}\/`) } }] }).lean();
            _.forEach(posts, (post) => {
              expect(post.blocked_for_apps).to.be.deep.eq(_.map(apps, 'host'));
            });
          });
        });
      });
      describe('on mute by regular user', async () => {
        beforeEach(async () => {
          for (let i = 0; i < _.random(5, 10); i++) {
            await PostFactory.Create({ author: _.sample(mutedUsers) });
          }
          operation = mutedData({ following: mutedUsers, action: MUTE_ACTION.MUTE });
          await sitesHelper.mutedUsers(operation);
        });
        it('should have records in muted collection', async () => {
          const records = await MutedUser.find({ mutedBy: operation.follower }).lean();
          expect(records).to.have.length(mutedUsers.length);
        });
        it('should not affect on posts blocked_for_apps', async () => {
          const posts = await Post.find({}).lean();
          _.forEach(posts, (post) => {
            expect(post.blocked_for_apps).to.be.an('array').that.is.empty;
          });
        });
      });
      describe('on unmute by regular user', async () => {
        const user = faker.random.string();
        beforeEach(async () => {
          for (const muted of mutedUsers) {
            await MutedUsersFactory.Create({
              userName: muted,
              mutedBy: user,
            });
          }
          operation = mutedData({
            follower: user, following: mutedUsers, action: MUTE_ACTION.UNMUTE,
          });
          await sitesHelper.mutedUsers(operation);
        });
        it('should not have records in muted collection', async () => {
          const records = await MutedUser.find({ mutedBy: operation.follower }).lean();
          expect(records).to.be.an('array').that.is.empty;
        });
      });
    });
  });

  describe('On setWebsiteReferralAccount', async () => {
    let result, operation;
    describe('On not valid data', async () => {
      it('should return false when no auth data', async () => {
        operation = setReferral({ host: faker.random.string(), account: faker.random.string() });
        result = await sitesHelper.setWebsiteReferralAccount(operation);
        expect(result).to.be.false;
      });
      it('should return false when no host', async () => {
        operation = setReferral({ owner: faker.random.string(), account: faker.random.string() });
        result = await sitesHelper.setWebsiteReferralAccount(operation);
        expect(result).to.be.false;
      });
      it('should return false when no account', async () => {
        operation = setReferral({ host: faker.random.string(), owner: faker.random.string() });
        result = await sitesHelper.setWebsiteReferralAccount(operation);
        expect(result).to.be.false;
      });
      it('should return false when auth account is not owner', async () => {
        operation = setReferral({ host: faker.random.string(), owner: faker.random.string(), account: faker.random.string() });
        result = await sitesHelper.setWebsiteReferralAccount(operation);
        expect(result).to.be.false;
      });
    });
    describe('On valid data', async () => {
      const account = faker.random.string();
      beforeEach(async () => {
        operation = setReferral({ host: app.host, owner: app.owner, account });
        result = await sitesHelper.setWebsiteReferralAccount(operation);
        app = await App.findOne({ host: app.host, owner: app.owner }).lean();
      });
      it('should return true on valid data', async () => {
        expect(result).to.be.true;
      });
      it('should update app field for account', async () => {
        expect(_.get(app, PATH.REFERRAL_ACCOUNT)).to.be.eq(account);
      });
    });
  });
});
