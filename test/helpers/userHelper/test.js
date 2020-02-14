const {
  expect, userHelper, sinon, faker, importUser, User, usersUtil,
} = require('test/testHelper');
const { UserFactory } = require('test/factories');

describe('userHelper', async () => {
  describe('on checkAndCreateUser', async () => {
    describe('on valid input data', async () => {
      describe('if user did not exist before', async () => {
        let newUserName,
          result,
          createdUser;
        beforeEach(async () => {
          newUserName = faker.name.firstName().toLowerCase();
          sinon.stub(importUser, 'send').returns({ response: 'its ok' });
          sinon.stub(usersUtil, 'getUser').returns({ user: 'its ok' });
          result = await userHelper.checkAndCreateUser(newUserName);
          createdUser = await User.findOne({ name: newUserName }).select('+user_metadata').lean();
        });
        afterEach(() => {
          sinon.restore();
        });
        it('should create user in DB', () => {
          expect(createdUser).is.exist;
        });
        it('should create user with default ZERO stage_version', () => {
          expect(createdUser.stage_version).to.be.eq(0);
        });
        it('should call importUser.send once', () => {
          expect(importUser.send).to.be.calledOnce;
        });
        it('should return created user', () => {
          expect(result.user).is.exist;
        });
        it('should return correct user', () => {
          expect(result.user).to.deep.eq(createdUser);
        });
      });
      describe('if user existed before', async () => {
        let user,
          newUserName,
          result,
          createdUser;
        beforeEach(async () => {
          newUserName = faker.name.firstName().toLowerCase();
          user = (await UserFactory.Create({
            name: newUserName, count_posts: 10, wobjects_weight: 100, stage_version: 1,
          })).user;
          sinon.stub(usersUtil, 'getUser').returns({ user: 'its ok' });
          sinon.stub(importUser, 'send').returns({ response: 'its ok' });
          result = await userHelper.checkAndCreateUser(newUserName);
          createdUser = await User.findOne({ name: newUserName }).lean();
        });
        afterEach(() => {
          sinon.restore();
        });
        it('should still exist user in DB', () => {
          expect(createdUser).is.exist;
        });
        it('should not update stage_version on exist user', () => {
          expect(createdUser.stage_version).to.be.eq(1);
        });
        it('should not call importUser.send', () => {
          expect(importUser.send).to.not.been.called;
        });
        it('should return created user', () => {
          expect(result.user).is.exist;
        });
        it('should return correct user', () => {
          expect(result.user).to.deep.eq(user);
        });
      });
    });
  });
});
