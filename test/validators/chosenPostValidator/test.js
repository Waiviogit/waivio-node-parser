const { expect } = require('../../testHelper');
const { AppFactory } = require('../../factories');
const { chosenPostValidator } = require('../../../validator');

describe('chosenPostValidator', async () => {
  describe('on validate comment body', async () => {
    const tests = [
      { body: '#daily @waivio', exp_res: true },
      { body: '#weekly @lalalend', exp_res: true },
      { body: '#dail @kek', exp_res: false },
      { body: '#weekl @test', exp_res: false },
      { body: '#daily @wa', exp_res: false },
      { body: '#weekly @waiviowaiviowaiviowaivio', exp_res: true },
      { body: '#daily@app_name', exp_res: false },
      { body: '@daily @app_name', exp_res: false },
      { body: '#daily #app_name', exp_res: false },
      { body: '# @app_name', exp_res: false },
      { body: '# @', exp_res: false },
    ];

    tests.forEach((test) => {
      it(`should return "${test.exp_res}" for input body: ${test.body} `, () => {
        expect(chosenPostValidator.checkBody(test.body)).to.eq(test.exp_res);
      });
    });
  });

  describe('on validate app name', async () => {
    let app;
    beforeEach(async () => {
      app = await AppFactory.Create({});
    });
    it('should return true if name correct', async () => {
      const res = await chosenPostValidator.validateApp(app.name);
      expect(res).to.be.true;
    });
    it('should return false if name incorrect', async () => {
      const res = await chosenPostValidator.validateApp(`${app.name}_incorrect_test`);
      expect(res).to.be.false;
    });
    it('should return false if name not specified', async () => {
      const res = await chosenPostValidator.validateApp();
      expect(res).to.be.false;
    });
  });

  describe('on validate responsible user name', async () => {
    let app;
    beforeEach(async () => {
      app = await AppFactory.Create({});
    });
    it('should return true if app and user name correct', async () => {
      const res = await chosenPostValidator.validateResponsibleUser({ app_name: app.name, user_name: app.admin });
      expect(res).to.be.true;
    });
    it('should return false if app and user name incorrect', async () => {
      const res = await chosenPostValidator.validateResponsibleUser({ app_name: `${app.name}_inctest`, user_name: `${app.admin}incorrect_test` });
      expect(res).to.be.false;
    });
    it('should return false if app name incorrect', async () => {
      const res = await chosenPostValidator.validateResponsibleUser({ app_name: `${app.name}_inctest`, user_name: app.admin });
      expect(res).to.be.false;
    });
    it('should return false if user name incorrect', async () => {
      const res = await chosenPostValidator.validateResponsibleUser({ app_name: app.name, user_name: `${app.admin}_inc_test` });
      expect(res).to.be.false;
    });
  });
});
