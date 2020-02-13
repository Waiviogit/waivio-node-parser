const _ = require('lodash');
const {
  expect, sinon, faker, followObjectParser, userParsers, Post,
} = require('../../testHelper');
const { reblogPost } = require('../../../utilities/guestOperations/customJsonOperations');
const { UserFactory, ObjectFactory, PostFactory } = require('../../factories');
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
  describe('on reblogPost', async () => {
    let validOp,
      mockPost,
      mockUser;
    beforeEach(async () => {
      mockPost = await PostFactory.Create();
      mockUser = (await UserFactory.Create()).user;
      validOp = {
        required_posting_auths: [mockListBots[0]],
        id: 'waivio_guest_reblog',
        json: JSON.stringify([
          'reblog',
          {
            account: mockUser.name,
            author: mockPost.author,
            permlink: mockPost.permlink,
          },
        ]),
      };
      sinon.spy(userParsers, 'followUserParser');
      sinon.spy(userParsers, 'reblogPostParser');
    });
    afterEach(() => {
      userParsers.followUserParser.restore();
      userParsers.reblogPostParser.restore();
    });
    describe('on valid author operation', async () => {
      beforeEach(async () => {
        await reblogPost(validOp);
      });
      it('should call followUserParser once', async () => {
        expect(userParsers.followUserParser).to.be.calledOnce;
      });
      it('should call reblogPostParser once', async () => {
        expect(userParsers.reblogPostParser).to.be.calledOnce;
      });
      it('should create reblogged post in DB', async () => {
        const post = await Post.findOne({ author: mockUser.name, permlink: `${mockPost.author}/${mockPost.permlink}` });
        expect(post).to.exist;
      });
      it('should create reblogged post with correct reference to source post', async () => {
        const post = await Post.findOne({ author: mockUser.name, permlink: `${mockPost.author}/${mockPost.permlink}` });
        expect(post.reblog_to).to.be.deep.eq(
          { author: mockPost.author, permlink: mockPost.permlink },
        );
      });
    });
    describe('on not valid proxy bot', async () => {
      beforeEach(async () => {
        validOp.required_posting_auths = [faker.name.firstName()];
        await reblogPost(validOp);
      });
      it('should not call followUserParser', () => {
        expect(userParsers.followUserParser).to.not.be.called;
      });
      it('should not call reblogPostParser', () => {
        expect(userParsers.reblogPostParser).to.not.be.called;
      });
    });
    describe('on not valid json', async () => {
      beforeEach(async () => {
        validOp.json = 'not_valid_json';
        await reblogPost(validOp);
      });
      it('should not call followUserParser', async () => {
        expect(userParsers.followUserParser).to.not.be.called;
      });
      it('should not call reblogPostParser', async () => {
        expect(userParsers.reblogPostParser).to.not.be.called;
      });
    });
  });
});
