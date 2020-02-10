const _ = require('lodash');
const {
  expect, faker, sinon, UserModel, User, userHelper,
} = require('test/testHelper');
const { guestCreate } = require('../../../utilities/guestOperations/customJsonOperations');
const { UserFactory } = require('../../factories');
const constants = require('../../../utilities/constants');

describe('customJsonOperations', async () => {
  let mockListBots;
  beforeEach(async () => {
    mockListBots = _.times(5, faker.name.firstName);
    sinon.stub(constants, 'WAIVIO_PROXY_BOTS').value(mockListBots);
  });
  afterEach(() => {
    sinon.restore();
  });
  describe('on guestCreate', async () => {
    let validOp,
      validJson;
    beforeEach(async () => {
      validJson = {
        userId: `waivio_${faker.random.string(5)}`,
        displayName: faker.name.firstName(),
        json_metadata: JSON.stringify({ name: 'lalal', address: 'allal' }),
      };
      validOp = { required_posting_auths: [mockListBots[0]], json: JSON.stringify(validJson) };
    });
    describe('on valid input', async () => {
      describe('if user dont exist', async () => {
        beforeEach(async () => {
          sinon.stub(userHelper, 'checkAndCreateUser').returns({});
          sinon.spy(UserModel, 'updateOne');
          await guestCreate(validOp);
        });
        afterEach(() => {
          sinon.restore();
        });
        it('should call checkAndCreate on User helper once', () => {
          expect(userHelper.checkAndCreateUser).to.be.calledOnce;
        });
        it('should call updateOne on User Model once', () => {
          expect(UserModel.updateOne).to.be.calledOnce;
        });
        it('should create new User in database', async () => {
          const user = await User.findOne({ name: validJson.userId });
          expect(user).to.exist;
        });
        it('should create new User in database with correct name', async () => {
          const user = await User.findOne({ name: validJson.userId });
          expect(user.name).to.be.eq(validJson.userId);
        });
        it('should create new User in database with correct alias', async () => {
          const user = await User.findOne({ name: validJson.userId });
          expect(user.alias).to.be.eq(validJson.displayName);
        });
        it('should create new User in database with correct json_metadata', async () => {
          const user = await User.findOne({ name: validJson.userId });
          expect(user.json_metadata).to.be.eq(validJson.json_metadata);
        });
      });
      describe('if user already exist', async () => {
        let user;
        beforeEach(async () => {
          user = (await UserFactory.Create({ name: validJson.userId, count_posts: 100 })).user;
          sinon.spy(UserModel, 'updateOne');
          sinon.spy(userHelper, 'checkAndCreateUser');
          await guestCreate(validOp);
        });
        afterEach(() => {
          sinon.restore();
        });
        it('should call checkAndCreate on User Model once', () => {
          expect(userHelper.checkAndCreateUser).to.be.calledOnce;
        });
        it('should call updateOne on User Model once', () => {
          expect(UserModel.updateOne).to.be.calledOnce;
        });
        it('should update User in database with correct alias', async () => {
          const updUser = await User.findOne({ name: validJson.userId });
          expect(updUser.alias).to.be.eq(validJson.displayName);
        });
        it('should update User in database with correct json_metadata', async () => {
          const updUser = await User.findOne({ name: validJson.userId });
          expect(updUser.json_metadata).to.be.eq(validJson.json_metadata);
        });
        it('should not delete exists keys', async () => {
          const upd_user = await User.findOne({ name: user.name }).lean();
          expect(upd_user.count_posts).to.be.eq(100);
        });
      });
    });
  });
});
