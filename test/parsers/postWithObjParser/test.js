const config = require('config');
const {
  expect, postWithObjectParser, Post, faker, postsUtil, sinon, User,
  redisGetter, CommentRef, postHelper, PostModel, usersUtil, userHelper,
} = require('test/testHelper');
const {
  PostFactory, UserFactory, ObjectFactory, AppFactory,
} = require('test/factories');
const { postWithWobjValidator } = require('validator');

describe('postWithObjectParser', async () => {
  describe('on valid input data', async () => {
    describe('if user and post doesnt exists', async () => {
      let mockPost, mockMetadata, mockOp, mockWobj, postsUtilStub, result, userUtilStub;
      beforeEach(async () => {
        await AppFactory.Create({ host: config.appHost });
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
        sinon.spy(postHelper, 'parseBodyWobjects');
        result = await postWithObjectParser.parse(mockOp, mockMetadata);
      });
      afterEach(() => {
        sinon.restore();
      });
      it('should create user "author" of post', async () => {
        const user = await User.findOne({ name: mockPost.author });
        expect(user).to.exist;
      });
      it('should create user with count of posts 1', async () => {
        const user = await User.findOne({ name: mockPost.author });
        expect(user.count_posts).to.be.eq(1);
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
      it('should create new post in db', async () => {
        const res = await Post.findOne({ author: mockPost.author, permlink: mockPost.permlink });
        expect(res).to.exist;
      });
      it('should add wobjects with zero percent to metadata', async () => {
        let post = await Post.findOne({ author: mockPost.author, permlink: mockPost.permlink });
        post = post.toObject();
        expect(post.wobjects).to.have.length(2);
      });
      it('should call parseBodyWobjects once', async () => {
        expect(postHelper.parseBodyWobjects).to.be.calledOnce;
      });
    });

    describe('if user exist, and post doesnt exist', async () => {
      let mockPost, mockMetadata, mockOp, mockWobj, postsUtilStub, author;
      beforeEach(async () => {
        await AppFactory.Create({ host: config.appHost });
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
        sinon.spy(postHelper, 'parseBodyWobjects');
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
      it('should call parseBodyWobjects once', async () => {
        expect(postHelper.parseBodyWobjects).to.be.calledOnce;
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
              { author_permlink: faker.random.string(10), percent: 35 },
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
  describe('on addWobjectNames', async () => {
    let mockPost, notificationData, wobj1, wobj2, wobjects;
    const wobj1Name = faker.random.string(10);
    const wobj2Name = faker.random.string(10);

    describe('when wobjects are empty', async () => {
      beforeEach(async () => {
        mockPost = await PostFactory.Create({ onlyData: true });
        ({ notificationData } = await postWithObjectParser.addWobjectNames(mockPost));
      });
      it('mockPost be deep eq to result', async () => {
        expect(notificationData).to.be.deep.eq(mockPost);
      });
    });
    describe('when all objects exists and all valid', async () => {
      beforeEach(async () => {
        await AppFactory.Create({ host: config.appHost });
        wobj1 = await ObjectFactory.Create({ appends: [{ name: 'name', body: wobj1Name }] });
        wobj2 = await ObjectFactory.Create({ appends: [{ name: 'name', body: wobj2Name }] });

        mockPost = await PostFactory.Create({
          onlyData: true,
          wobjects: [
            { author_permlink: wobj1.author_permlink },
            { author_permlink: wobj2.author_permlink },
          ],
        });
        ({ notificationData: { wobjects } } = await postWithObjectParser.addWobjectNames(mockPost));
      });
      it('all wobjects should have property name with appropriate name and author permlink', async () => {
        expect(wobjects).to.have.deep.members([
          { name: wobj1Name, author_permlink: wobj1.author_permlink },
          { name: wobj2Name, author_permlink: wobj2.author_permlink },
        ]);
      });
    });
    describe('when function can not find name or field downvoted it take name from wobject default name', async () => {
      beforeEach(async () => {
        await AppFactory.Create({ host: config.appHost });
        wobj1 = await ObjectFactory.Create({ objName: wobj1Name });
        mockPost = await PostFactory
          .Create({ onlyData: true, wobjects: [{ author_permlink: wobj1.author_permlink }] });
        ({ notificationData: { wobjects } } = await postWithObjectParser.addWobjectNames(mockPost));
      });
      it('wobject name in notificationData should be eq default wobject name ', async () => {
        expect(wobjects[0].name).to.be.eq(wobj1Name);
      });
    });
    describe('when function can not find field and can not find wobject by permlink', async () => {
      beforeEach(async () => {
        await AppFactory.Create({ host: config.appHost });
        const wobjArr = [
          { author_permlink: faker.random.string(10), tagged: wobj1Name },
          { author_permlink: faker.random.string(10), objectName: wobj2Name },
        ];
        mockPost = await PostFactory
          .Create({ onlyData: true, wobjects: wobjArr });
        ({ notificationData: { wobjects } } = await postWithObjectParser.addWobjectNames(mockPost));
      });
      it('should take name from key tagged', async () => {
        expect(wobjects[0].name).to.be.eq(wobj1Name);
      });
      it('should take name from key objectName', async () => {
        expect(wobjects[1].name).to.be.eq(wobj2Name);
      });
    });
  });
});
