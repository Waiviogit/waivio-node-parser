const _ = require('lodash');
const {
  expect, faker, dropDatabase, sitesHelper, App, sinon, AppModel,
} = require('test/testHelper');
const { STATUSES } = require('constants/sitesData');
const { AppFactory } = require('test/factories');
const { settingsData, authorityData } = require('./mocks');

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
  describe('On activationActions', async () => {
    let operation;
    beforeEach(async () => {
      operation = {
        required_posting_auths: [author],
        json: JSON.stringify({ appId: app._id }),
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
      operation = authorityData({ author, appId: app._id, names: [authority] });
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
});
