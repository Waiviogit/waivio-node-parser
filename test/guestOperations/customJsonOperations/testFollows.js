const _ = require('lodash');
const {
  expect, sinon, faker, followObjectParser, userParsers, User, appHelper, userHelper, UserModel, Subscriptions, WobjectSubscriptions,
} = require('test/testHelper');
const { followUser, followWobject } = require('utilities/guestOperations/customJsonOperations');
const { UserFactory, ObjectFactory } = require('test/factories');

describe('customJsonOperations', async () => {
  let mockListBots;
  beforeEach(async () => {
    mockListBots = _.times(5, faker.name.firstName);
    sinon.stub(appHelper, 'getProxyBots').returns(Promise.resolve(mockListBots));
    sinon.stub(userHelper, 'checkAndCreateUser').returns({ user: 'its ok' });
    sinon.stub(userHelper, 'checkAndCreateByArray').returns({ user: 'its ok' });
  });
  afterEach(() => {
    sinon.restore();
  });
  describe('on followUser', async () => {
    let validOp,
      follower,
      following;
    beforeEach(async () => {
      follower = (await UserFactory.Create()).user;
      following = (await UserFactory.Create()).user;
      validOp = {
        required_posting_auths: [mockListBots[0]],
        id: 'waivio_guest_follow',
        json: JSON.stringify(['follow', { follower: follower.name, following: following.name, what: ['blog'] }]),
      };
      sinon.spy(userParsers, 'followUserParser');
    });
    afterEach(() => {
      sinon.restore();
    });
    describe('On unfollowUser', async () => {
      beforeEach(async () => {
        await followUser(validOp);
        validOp.required_posting_auths = [mockListBots[0]];
        validOp.json = JSON.stringify(['follow', { follower: follower.name, following: following.name, what: [] }]);
        await followUser(validOp);
      });
      it('should remove follower from following', async () => {
        const user = await Subscriptions.findOne(
          { follower: follower.name, following: following.name },
        );
        expect(user).to.be.null;
      });
      it('should decrease follower counters', async () => {
        const user = await User.findOne({ name: following.name });
        expect(user.followers_count).to.be.eq(0);
      });
      it('should not call UserModel remove following method if following not in follow_user list', async () => {
        sinon.spy(UserModel, 'removeUserFollow');
        await followUser(validOp);
        expect(UserModel.removeUserFollow).to.be.not.called;
      });
    });
    describe('on valid author operation', async () => {
      beforeEach(async () => {
        await followUser(validOp);
      });
      it('should call followUserParser once', async () => {
        expect(userParsers.followUserParser).to.be.calledOnce;
      });
      it('should submit follow for follower', async () => {
        const result = await Subscriptions.findOne(
          { follower: follower.name, following: following.name },
        );
        expect(result).to.be.exist;
      });
      it('should not call follow method if follower user_follow list includes following', async () => {
        sinon.spy(UserModel, 'addUserFollow');
        await followUser(validOp);
        expect(UserModel.addUserFollow).to.be.not.called;
      });
      it('should increase followers count at following', async () => {
        const user = await User.findOne({ name: following.name });
        expect(user.followers_count).to.be.eq(1);
      });
    });
    describe('on not valid proxy bot', async () => {
      beforeEach(async () => {
        validOp.required_posting_auths = [faker.name.firstName()];
        await followUser(validOp);
      });
      it('should not call followUserParser', () => {
        expect(userParsers.followUserParser).to.not.be.called;
      });
      it('should not add following name to follower list follows', async () => {
        const user = await User.findOne({ name: follower.name });
        expect(user.users_follow).to.not.include(following.name);
      });
    });
    describe('on not valid json', async () => {
      beforeEach(async () => {
        validOp.json = 'not_valid_json';
        await followUser(validOp);
      });
      it('should not call followUserParser', async () => {
        expect(userParsers.followUserParser).to.not.be.called;
      });
    });
  });

  describe('on followWobject', async () => {
    let validOp,
      follower,
      wobject;
    beforeEach(async () => {
      follower = (await UserFactory.Create()).user;
      wobject = await ObjectFactory.Create();
      validOp = {
        required_posting_auths: [mockListBots[0]],
        id: 'waivio_guest_follow_wobject',
        json: JSON.stringify(['follow', { user: follower.name, author_permlink: wobject.author_permlink, what: ['blog'] }]),
      };
      sinon.spy(followObjectParser, 'parse');
    });
    afterEach(() => {
      followObjectParser.parse.restore();
    });
    describe('on valid author operation', async () => {
      beforeEach(async () => {
        await followWobject(validOp);
      });
      it('should call followObjectParser once', () => {
        expect(followObjectParser.parse).to.be.calledOnce;
      });
      it('should add record to WobjectSubscriptions collection"', async () => {
        const subscription = WobjectSubscriptions
          .findOne({ follower: follower.name, following: wobject.author_permlink });
        expect(subscription).to.exist;
      });
    });
    describe('on not valid proxy bot', async () => {
      beforeEach(async () => {
        validOp.required_posting_auths = [faker.name.firstName()];
        await followWobject(validOp);
      });
      it('should not call followObjectParser', () => {
        expect(followObjectParser.parse).to.not.be.called;
      });
      it('should add author permlink to user "wobjects_follow"', async () => {
        const user = await User.findOne({ name: follower.name });
        expect(user.objects_follow).to.not.include(wobject.author_permlink);
      });
    });
    describe('on not valid json', async () => {
      beforeEach(async () => {
        validOp.json = 'not_valid_json';
        await followWobject(validOp);
      });
      it('should not call followUserParser', async () => {
        expect(followObjectParser.parse).to.not.be.called;
      });
    });
  });
});
