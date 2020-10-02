const { expect, Post } = require('test/testHelper');
const postModeration = require('utilities/moderation/postModeration');
const {
  AppFactory, PostFactory, UserFactory, ObjectFactory,
} = require('../factories');


describe('postModeration', async () => {
  describe('on checkDownVote', async () => {
    describe('on valid data', async () => {
      let admin, moderator, wobject, post, app;

      beforeEach(async () => {
        admin = (await UserFactory.Create()).user;
        moderator = (await UserFactory.Create()).user;
        wobject = await ObjectFactory.Create();
        post = await PostFactory.Create({
          additionsForPost: {
            wobjects: [{ author_permlink: wobject.permlink, percent: 100 }],
          },
        });
        app = await AppFactory.Create({
          admins: [admin.name],
          moderators: [moderator.name],
        });
      });
      describe('on vote by admin', async () => {
        let updPost;
        beforeEach(async () => {
          await postModeration.checkDownVote({
            voter: admin.name,
            author: post.author,
            permlink: post.permlink,
          });
          updPost = await Post.findOne({ _id: post._id }).lean();
        });
        it('should update post with blocked app if admin voter', async () => {
          expect(updPost).to.include.all.keys(['blocked_for_apps']);
        });
        it('should add app to blocked_for_apps field', async () => {
          expect(updPost.blocked_for_apps).to.deep.eq([app.host]);
        });
      });
      describe('on vote by moder', async () => {
        let updPost;
        beforeEach(async () => {
          await postModeration.checkDownVote({
            voter: moderator.name,
            author: post.author,
            permlink: post.permlink,
          });
          updPost = await Post.findOne({ _id: post._id }).lean();
        });
        it('should update post with blocked app if admin voter', async () => {
          expect(updPost).to.include.all.keys(['blocked_for_apps']);
        });
        it('should add app to blocked_for_apps field', async () => {
          expect(updPost.blocked_for_apps).to.deep.eq([app.host]);
        });
      });
    });
  });
});
