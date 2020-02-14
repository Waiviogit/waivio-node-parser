const {
  expect, postWithObjectParser, Post, faker, postsUtil, sinon, User, redisGetter, CommentRef, postHelper, PostModel, usersUtil, userHelper,
} = require('../../testHelper');
const { PostFactory, UserFactory, ObjectFactory } = require('../../factories');
const { postWithWobjValidator } = require('../../../validator');

describe('postWithObjectParser', async () => {
  describe('on valid input data', async () => {
    describe('if user and post doesnt exists', async () => {
      let mockPost,
        mockMetadata,
        mockOp,
        mockWobj,
        postsUtilStub,
        result,
        userUtilStub;
      beforeEach(async () => {
        mockPost = await PostFactory.Create({ onlyData: true });
        mockWobj = await ObjectFactory.Create();
        mockOp = {
          author: mockPost.author,
          permlink: mockPost.permlink,
        };
        mockMetadata = {
          wobj: {
            wobjects: [
              { author_permlink: mockWobj.author_permlink, percent: 100 },
              { author_permlink: faker.random.string(10), percent: 0 },
            ],
          },
          app: faker.address.city(),
        };
        postsUtilStub = sinon.stub(postsUtil, 'getPost').callsFake((a, b) => ({ post: mockPost }));
        userUtilStub = sinon.stub(usersUtil, 'getUser').returns(Promise.resolve({ user: faker.random.string() }));
        sinon.spy(postWithWobjValidator, 'validate');
        sinon.spy(postHelper, 'objectIdFromDateString');
        result = await postWithObjectParser.parse(mockOp, mockMetadata);
      });
      afterEach(() => {
        postsUtilStub.restore();
        userUtilStub.restore();
        postWithWobjValidator.validate.restore();
        postHelper.objectIdFromDateString.restore();
      });
      it('should create user "author" of post', async () => {
        const user = await User.findOne({ name: mockPost.author });
        expect(user).to.exist;
      });
      it('should create user with count of posts 1', async () => {
        const user = await User.findOne({ name: mockPost.author });
        expect(user.count_posts).to.be.eq(1);
      });
      it('should call "getPost" on post util with correct author and permlink', () => {
        expect(postsUtilStub).to.be.calledWith(mockPost.author, mockPost.permlink);
      });
      it('should pass postWithWobj validation', () => {
        expect(postWithWobjValidator.validate).to.be.returned(true);
      });
      it('should add post reference to redis', async () => {
        const res = await redisGetter.getHashAll(`${mockPost.author}_${mockPost.permlink}`);
        expect(res).to.exist;
      });
      it('should add post reference to mongo', async () => {
        const res = await CommentRef.findOne({ comment_path: `${mockPost.author}_${mockPost.permlink}` });
        expect(res).to.exist;
      });
      it('should call postHelper.objectIdFromDateString with correct params', () => {
        expect(postHelper.objectIdFromDateString).to.be.calledWith(mockPost.created);
      });
      it('should create new post in db', async () => {
        const res = await Post.findOne({ author: mockPost.author, permlink: mockPost.permlink });
        expect(res).to.exist;
      });
      it('should not add wobjects with zero percent to metadata', async () => {
        let post = await Post.findOne({ author: mockPost.author, permlink: mockPost.permlink });
        post = post.toObject();
        expect(post.wobjects.map((i) => ({ author_permlink: i.author_permlink, percent: i.percent })))
          .to.deep.eq([{ author_permlink: mockWobj.author_permlink, percent: 100 }]);
      });
    });

    describe('if user exist, and post doesnt exist', async () => {
      let mockPost,
        mockMetadata,
        mockOp,
        mockWobj,
        postsUtilStub,
        author;
      beforeEach(async () => {
        const { user } = await UserFactory.Create();
        author = user;
        mockPost = await PostFactory.Create({ onlyData: true, author: author.name });
        mockWobj = await ObjectFactory.Create();
        mockOp = {
          author: mockPost.author,
          permlink: mockPost.permlink,
        };
        mockMetadata = {
          wobj: { wobjects: [{ author_permlink: mockWobj.author_permlink, percent: 100 }] },
          app: faker.address.city(),
        };
        postsUtilStub = sinon.stub(postsUtil, 'getPost').callsFake((a, b) => ({ post: mockPost }));
        sinon.stub(userHelper, 'checkAndCreateUser').returns({ user: 'its ok' });
        sinon.spy(postWithWobjValidator, 'validate');
        sinon.spy(postHelper, 'objectIdFromDateString');
        await postWithObjectParser.parse(mockOp, mockMetadata);
      });
      afterEach(() => {
        sinon.restore();
      });
      it('should update author with increase count_posts', async () => {
        const upd_author = await User.findOne({ name: mockPost.author });
        expect(upd_author.count_posts - author.count_posts).to.be.eq(1);
      });
      it('should call "getPost" on post util with correct author and permlink', () => {
        expect(postsUtilStub).to.be.calledWith(mockPost.author, mockPost.permlink);
      });
      it('should pass postWithWobj validation', () => {
        expect(postWithWobjValidator.validate).to.be.returned(true);
      });
      it('should add post reference to redis', async () => {
        const res = await redisGetter.getHashAll(`${mockPost.author}_${mockPost.permlink}`);
        expect(res).to.exist;
      });
      it('should add post reference to mongo', async () => {
        const res = await CommentRef.findOne({ comment_path: `${mockPost.author}_${mockPost.permlink}` });
        expect(res).to.exist;
      });
      it('should call postHelper.objectIdFromDateString with correct params', () => {
        expect(postHelper.objectIdFromDateString).to.be.calledWith(mockPost.created);
      });
      it('should create new post in db', async () => {
        const res = await Post.findOne({ author: mockPost.author, permlink: mockPost.permlink });
        expect(res).to.exist;
      });
    });

    describe('if post already exist', async () => {
      let mockPost,
        mockMetadata,
        mockOp,
        mockWobj,
        postsUtilStub,
        author;
      beforeEach(async () => {
        author = (await UserFactory.Create()).user;
        mockPost = await PostFactory.Create({ author: author.name });
        mockPost.body = faker.lorem.sentence(10); // return post with new body, imitate update content
        mockWobj = await ObjectFactory.Create();
        mockOp = {
          author: mockPost.author,
          permlink: mockPost.permlink,
        };
        mockMetadata = {
          wobj: { wobjects: [{ author_permlink: mockWobj.author_permlink, percent: 100 }] },
          app: faker.address.city(),
        };
        postsUtilStub = sinon.stub(postsUtil, 'getPost').callsFake((a, b) => ({ post: mockPost }));
        sinon.stub(userHelper, 'checkAndCreateUser').returns({ user: 'its ok' });
        sinon.spy(postWithWobjValidator, 'validate');
        sinon.spy(postHelper, 'objectIdFromDateString');
        await postWithObjectParser.parse(mockOp, mockMetadata);
      });
      afterEach(() => {
        sinon.restore();
      });
      it('should not increase user count of posts', async () => {
        const upd_author = await User.findOne({ name: mockPost.author });
        expect(upd_author.count_posts - author.count_posts).to.be.eq(0);
      });
      it('should add post reference to redis', async () => {
        const res = await redisGetter.getHashAll(`${mockPost.author}_${mockPost.permlink}`);
        expect(res).to.exist;
      });
      it('should update ref in redis with correct wobjects data', async () => {
        const res = await redisGetter.getHashAll(`${mockPost.author}_${mockPost.permlink}`);
        expect(JSON.parse(res.wobjects)).to.be.deep.eq([{ author_permlink: mockWobj.author_permlink, percent: 100 }]);
      });
      it('should add post reference to mongo', async () => {
        const res = await CommentRef.findOne({ comment_path: `${mockPost.author}_${mockPost.permlink}` });
        expect(res).to.exist;
      });
      it('should update commentRef in mongo with correct "wobjects" data', async () => {
        const res = await CommentRef.findOne({ comment_path: `${mockPost.author}_${mockPost.permlink}` });
        expect(JSON.parse(res.wobjects)).to.be.deep.eq([{ author_permlink: mockWobj.author_permlink, percent: 100 }]);
      });
      it('should not call postHelper.objectIdFromDateString', () => {
        expect(postHelper.objectIdFromDateString).to.be.not.called;
      });
      it('should update post with new "body"', async () => {
        const res = await Post.findOne({ author: mockPost.author, permlink: mockPost.permlink });
        expect(res.body).to.be.eq(mockPost.body);
      });
    });
  });
  describe('On called with post in parameters', async () => {
    let mockPost,
      mockMetadata,
      mockOp,
      mockWobj,
      author,
      updPost;
    beforeEach(async () => {
      sinon.stub(userHelper, 'checkAndCreateUser').returns({ user: 'its ok' });
      author = (await UserFactory.Create()).user;
      mockPost = await PostFactory.Create({ author: author.name });
      mockPost.body = faker.lorem.sentence(10); // return post with new body, imitate update content
      mockWobj = await ObjectFactory.Create();
      mockOp = {
        author: mockPost.author,
        permlink: mockPost.permlink,
      };
      updPost = await PostFactory.Create({ onlyData: true, author: mockOp.author, permlink: mockOp.permlink });
      mockMetadata = {
        wobj: { wobjects: [{ author_permlink: mockWobj.author_permlink, percent: 100 }] },
        app: faker.address.city(),
      };
      sinon.spy(postsUtil, 'getPost');
      await postWithObjectParser.parse(mockOp, mockMetadata, updPost);
    });
    afterEach(() => {
      sinon.restore();
    });
    it('should not call get post from steem method if parser will called with post in params', async () => {
      expect(postsUtil.getPost).to.be.not.called;
    });
    it('should update exist post with updatePost data ', async () => {
      const { post } = await PostModel.findOne(mockOp);
      expect(post.children).to.be.eq(updPost.children);
    });
  });

  describe('on invalid input data', async () => {
    describe('when wobjects percent sum greater than 100', async () => {
      let mockPost,
        mockMetadata,
        mockOp,
        postsUtilStub,
        author;
      beforeEach(async () => {
        author = (await UserFactory.Create()).user;
        mockPost = await PostFactory.Create({ author: author.name, onlyData: true });
        mockPost.body = faker.lorem.sentence(10); // return post with new body, imitate update content
        mockOp = {
          author: mockPost.author,
          permlink: mockPost.permlink,
        };
        mockMetadata = {
          wobj: {
            wobjects: [
              { author_permlink: faker.random.string(10), percent: 33 },
              { author_permlink: faker.random.string(10), percent: 34 },
              { author_permlink: faker.random.string(10), percent: 34 },
            ],
          },
          app: faker.address.city(),
        };
        postsUtilStub = sinon.stub(postsUtil, 'getPost').callsFake((a, b) => ({ post: mockPost }));
        sinon.stub(userHelper, 'checkAndCreateUser').returns({ user: 'its ok' });
        sinon.spy(postWithWobjValidator, 'validate');
        sinon.spy(postHelper, 'objectIdFromDateString');
        await postWithObjectParser.parse(mockOp, mockMetadata);
      });
      afterEach(() => {
        sinon.restore();
      });
      it('should not pass postWithWobj validator validation ', async () => {
        expect(postWithWobjValidator.validate).to.returned(false);
      });
      it('should not increase user count of posts', async () => {
        const upd_author = await User.findOne({ name: mockPost.author });
        expect(upd_author.count_posts - author.count_posts).to.be.eq(0);
      });
      it('should not add post reference to redis', async () => {
        const res = await redisGetter.getHashAll(`${mockPost.author}_${mockPost.permlink}`);
        expect(res).to.not.exist;
      });
      it('should not add post reference to mongo', async () => {
        const res = await CommentRef.findOne({ comment_path: `${mockPost.author}_${mockPost.permlink}` });
        expect(res).to.not.exist;
      });
      it('should not call postHelper.objectIdFromDateString', async () => {
        expect(postHelper.objectIdFromDateString).to.be.not.called;
      });
      it('should not create post', async () => {
        const res = await Post.findOne({ author: mockPost.author, permlink: mockPost.permlink });
        expect(res).to.not.exist;
      });
    });
  });
});
