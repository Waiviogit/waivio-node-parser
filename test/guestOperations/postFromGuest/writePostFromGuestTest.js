const _ = require('lodash');
const config = require('config');
const {
  expect, sinon, faker, postWithObjectParser, Post,
  postsUtil, commentRefGetter, appHelper, userHelper,
} = require('test/testHelper');
const {
  PostFactory, UserFactory, ObjectFactory, AppFactory,
} = require('test/factories');

describe('On postWithObjectParser', async () => {
  let mockListBots;
  beforeEach(async () => {
    sinon.stub(userHelper, 'checkAndCreateUser').returns({ user: 'its ok' });
    mockListBots = _.times(5, faker.name.firstName);
    sinon.stub(appHelper, 'getProxyBots').returns(Promise.resolve(mockListBots));
  });
  afterEach(() => {
    sinon.restore();
  });
  describe('when post was written from guest user', async () => {
    let mockPost,
      mockMetadata,
      mockOp,
      guestAuthor,
      proxyBotAuthor,
      mockWobj;
    beforeEach(async () => {
      guestAuthor = (await UserFactory.Create()).user;
      mockWobj = await ObjectFactory.Create();
      proxyBotAuthor = (await UserFactory.Create({ name: mockListBots[0] })).user;
      mockPost = await PostFactory.Create({
        onlyData: true,
        author: proxyBotAuthor.name,
        additionsForMetadata: {
          comment: {
            userId: guestAuthor.name, displayName: guestAuthor.alias || guestAuthor.name, social: 'facebook',
          },
        },
      });
      mockOp = {
        author: mockPost.author,
        permlink: mockPost.permlink,
        parent_author: mockPost.parent_author,
        parent_permlink: mockPost.parent_permlink,
        title: mockPost.title,
        body: mockPost.body,
        json_metadata: mockPost.json_metadata,
      };
      mockMetadata = {
        wobj: {
          wobjects: [
            { author_permlink: mockWobj.author_permlink, percent: 100 },
          ],
        },
        app: faker.address.city(),
        comment: {
          userId: guestAuthor.name, displayName: guestAuthor.alias || guestAuthor.name, social: 'facebook',
        },
      };
    });
    describe('on valid input', async () => {
      let createdPost;
      beforeEach(async () => {
        await AppFactory.Create({ host: config.appHost });
        sinon.stub(postsUtil, 'getPost').callsFake((a, b) => ({ post: mockPost }));
        await postWithObjectParser.parse({
          operation: mockOp, metadata: mockMetadata,
        });
        createdPost = await Post.findOne({ author: guestAuthor.name, permlink: mockPost.permlink });
      });
      afterEach(() => {
        postsUtil.getPost.restore();
      });
      it('should create post with author - guest user_name', async () => {
        expect(createdPost).to.be.exist;
      });
      it('should create post with root_author - proxy bot', async () => {
        expect(createdPost.root_author).to.be.eq(proxyBotAuthor.name);
      });
      it('should create post with different author and root_author', () => {
        expect(createdPost.author).to.not.be.eq(createdPost.root_author);
      });
      it('should add comment ref by root_author path', async () => {
        const res = await commentRefGetter.getCommentRef(`${proxyBotAuthor.name}_${mockPost.permlink}`);
        expect(res).to.exist;
      });
      it('should add comment ref with correct key guest_author', async () => {
        const res = await commentRefGetter.getCommentRef(`${proxyBotAuthor.name}_${mockPost.permlink}`);
        expect(res.guest_author).to.be.eq(guestAuthor.name);
      });
    });
  });
});
