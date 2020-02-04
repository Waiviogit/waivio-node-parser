const _ = require('lodash');
const {
  expect, sinon, faker, followObjectParser, userParsers, User,
} = require('../../testHelper');
const { followUser, followWobject } = require('../../../utilities/guestOperations/customJsonOperations');
const { UserFactory, ObjectFactory } = require('../../factories');
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
      userParsers.followUserParser.restore();
    });
    describe('on valid author operation', async () => {
      beforeEach(async () => {
        await followUser(validOp);
      });
      it('should call followUserParser once', async () => {
        expect(userParsers.followUserParser).to.be.calledOnce;
      });
      it('should submit follow for follower', async () => {
        const user = await User.findOne({ name: follower.name });
        expect(user.users_follow).to.include(following.name);
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
      it('should add author permlink to user "wobjects_follow"', async () => {
        const user = await User.findOne({ name: follower.name });
        expect(user.objects_follow).to.include(wobject.author_permlink);
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
