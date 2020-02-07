const { expect, appHelper } = require('../../testHelper');
const { AppFactory } = require('../../factories');

describe('App Helper', async () => {
  describe('Check app on blacklist validity', () => {
    let app;

    beforeEach(async () => {
      app = await AppFactory.Create({
        blacklists: {
          apps: ['apptest', 'lala', 'KeK'],
        },
      });
      process.env.APP_NAME = app.name;
    });
    afterEach(() => {
      delete process.env.APP_NAME;
    });
    it('should return false on validating app1', async () => {
      const res = await appHelper.checkAppBlacklistValidity({ app: 'apptest' });

      expect(res).to.be.false;
    });
    it('should return false on validating app2', async () => {
      const res = await appHelper.checkAppBlacklistValidity({ app: 'kek' });

      expect(res).to.be.false;
    });
    it('should return false on validating app3', async () => {
      const res = await appHelper.checkAppBlacklistValidity({ app: 'lala' });

      expect(res).to.be.false;
    });
    it('should return true on validating app1', async () => {
      const res = await appHelper.checkAppBlacklistValidity({ app: 'lalakek' });

      expect(res).to.be.true;
    });
    it('should return true on validating app2', async () => {
      const res = await appHelper.checkAppBlacklistValidity({ app: 'apptst' });

      expect(res).to.be.true;
    });
    it('should return true on validating app3', async () => {
      const res = await appHelper.checkAppBlacklistValidity({ app: 'H2O' });

      expect(res).to.be.true;
    });
  });
});
