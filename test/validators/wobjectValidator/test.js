const {
  expect, faker, sinon, appHelper,
} = require('test/testHelper');
const { wobjectValidator } = require('../../../validator');

describe('wobjectValidator', async () => {
  let blackListUsers;
  const requiredFieldsRatingVote = 'author,permlink,author_permlink,rate'.split(',');
  const validData = {};
  beforeEach(async () => {
    blackListUsers = [faker.random.string(), faker.random.string(), faker.random.string()];
    sinon.stub(appHelper, 'getBlackListUsers').returns(Promise.resolve({ users: blackListUsers }));
    requiredFieldsRatingVote.forEach((f) => {
      validData[f] = faker.random.string(10);
    });
  });
  afterEach(async () => {
    sinon.restore();
  });
  describe('on validateRatingVote ', async () => {
    beforeEach(async () => {
      validData.rate = faker.random.number(10);
    });
    it('should return true if all required field exist', async () => {
      expect(await wobjectValidator.validateRatingVote(validData)).to.be.true;
    });
    requiredFieldsRatingVote.forEach((field) => {
      it(`without field ${field} should return false`, async () => {
        const data = { ...validData };
        delete data[field];
        expect(await wobjectValidator.validateRatingVote(data)).to.be.false;
      });
    });
    it('should return false if operation author in blacklist', async () => {
      const operation = { required_posting_auths: blackListUsers };
      expect(await wobjectValidator.validateRatingVote(validData, operation)).to.be.false;
    });
  });

  describe('on validateObjectType ', async () => {
    it('should return true if all required field exist', async () => {
      validData.name = faker.random.string();
      const res = await wobjectValidator.validateObjectType(validData);
      expect(res).to.be.true;
      delete validData.name;
    });
    requiredFieldsRatingVote.forEach((field) => {
      it(`without field ${field} should return false`, async () => {
        const data = { ...validData };
        delete data[field];
        expect(await wobjectValidator.validateObjectType(data)).to.be.false;
      });
    });
    it('should return false if author in blacklist', async () => {
      validData.author = blackListUsers[0];
      expect(await wobjectValidator.validateObjectType(validData)).to.be.false;
    });
  });
});
