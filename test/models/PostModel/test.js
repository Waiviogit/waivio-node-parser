const _ = require('lodash');
const {
  expect, PostModel, Post, dropDatabase, faker, sinon, userHelper,
} = require('test/testHelper');
const { PostFactory } = require('test/factories');

describe('PostModel', async () => {
  describe('On getPostsRefs', async () => {
    let firstPostModel,
      secondPostModel;
    beforeEach(async () => {
      await dropDatabase();
      sinon.stub(userHelper, 'checkAndCreateUser').returns({ user: 'its ok' });
      firstPostModel = await PostFactory.Create();
      secondPostModel = await PostFactory.Create();
    });
    afterEach(async () => {
      sinon.restore();
    });
    it('should get correct length of posts', async () => {
      const postsRefs = await PostModel.getPostsRefs();

      expect(postsRefs.posts.length).to.deep.eq(2);
    });
    it('should check the identity authors of the posts', async () => {
      const firstResult = firstPostModel.author;
      const secondResult = secondPostModel.author;
      const postsRefs = await PostModel.getPostsRefs();

      expect(firstResult, secondResult).to.deep.eq(postsRefs.posts[0].author, postsRefs.posts[1].author);
    });
  });
  describe('On Create', async () => {
    let data,
      post;
    beforeEach(async () => {
      await dropDatabase();
      sinon.stub(userHelper, 'checkAndCreateUser').returns({ user: 'its ok' });
      data = await PostFactory.Create({ onlyData: true });
      const { post: createdPost } = await PostModel.create(data);
      post = createdPost;
    });
    afterEach(async () => {
      sinon.restore();
    });
    it('should get error with duplicate post by author+permlink', async () => {
      const result = await PostModel.create(data);
      expect(result.error).exist;
    });
    it('should get correct post author ', async () => {
      const postAuthor = post.author;
      expect(postAuthor).to.eq(data.author);
    });
    it('should user created successfully', async () => {
      const user = await Post.findOne({ permlink: data.permlink });
      expect(user.author).to.eq(data.author);
    });
    it('should get error with incorrect params', async () => {
      const result = await PostModel.create({ some: { date: { to: 'test' } } });
      expect(result.error).is.exist;
    });
  });
  describe('On findOne', async () => {
    let post;
    beforeEach(async () => {
      post = await PostFactory.Create();
      sinon.stub(userHelper, 'checkAndCreateUser').returns({ user: 'its ok' });
    });
    afterEach(async () => {
      sinon.restore();
    });
    it('should findOne post', async () => {
      const foundedPost = await PostModel.findOne({ author: post.author, permlink: post.permlink });

      expect(foundedPost.post).to.exist;
    });
    it('should not find not exist post', async () => {
      const result = await PostModel.findOne({ author: faker.random.string(), permlink: faker.random.string() });
      expect(result.post).not.exist;
    });
    it('should compare found post with created post', async () => {
      const foundedPost = await PostModel.findOne({ author: post.author, permlink: post.permlink });
      const expectedValues = _.pick(foundedPost.post, ['author', 'permlink', 'title']);
      const actualValues = _.pick(post, ['author', 'permlink', 'title']);
      expect(expectedValues).to.deep.eq(actualValues);
    });
    it('should get error without params', async () => {
      const result = await PostModel.findOne();
      expect(result.error).to.exist;
    });
  });
  describe('On update', async () => {
    let post, data, upd_post, result_update;
    beforeEach(async () => {
      post = await PostFactory.Create();
      data = {
        author: post.author,
        permlink: post.permlink,
        total_vote_weight: 10,
        net_votes: 50,
      };
      result_update = await PostModel.update(data);
      upd_post = await Post.findOne({ author: post.author, permlink: post.permlink });
      sinon.stub(userHelper, 'checkAndCreateUser').returns({ user: 'its ok' });
    });
    afterEach(async () => {
      sinon.restore();
    });
    it('should result update successfully', async () => {
      expect(result_update).is.exist;
    });
    it('should compare fields so they are the same ', async () => {
      expect({ net_votes: upd_post._doc.net_votes, total_vote_weight: upd_post.total_vote_weight })
        .to.not.eq({ net_votes: post.net_votes, total_vote_weight: post.total_vote_weight });
    });
    it('should return error', async () => {
      const postModel = await PostModel.update();

      expect('Cannot read property \'author\' of undefined').to.deep.eq(postModel.error.message);
    });
    it('should compare data properties and upd_post properties after update', async () => {
      expect(data).to.deep.eq({
        author: upd_post.author,
        permlink: upd_post.permlink,
        total_vote_weight: upd_post.total_vote_weight,
        net_votes: upd_post.net_votes,
      });
    });
  });
  describe('On removeWobjectsFromPost', async () => {
    let post;
    const wobj1 = { author_permlink: faker.random.string() };
    const wobj2 = { author_permlink: faker.random.string() };
    const wobj3 = { author_permlink: faker.random.string() };

    beforeEach(async () => {
      await dropDatabase();
      post = await PostFactory.Create({
        wobjects: [wobj1, wobj2, wobj3],
      });
    });
    it('should delete objects from post by the specified author_permlinks', async () => {
      const data = { author: post.root_author, permlink: post.permlink, wobjects: [wobj1, wobj2] };
      await PostModel.removeWobjectsFromPost(data);
      const { post: updatedPost } = await PostModel.findOne(data);
      expect(_.map(updatedPost.wobjects, 'author_permlink')).to.be.deep.eq([wobj3.author_permlink]);
    });
  });
});
