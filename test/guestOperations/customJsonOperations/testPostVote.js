const _ = require('lodash');
const {
  expect, sinon, faker, postsUtil, Post, Comment, votePostHelper,
} = require('../../testHelper');
const { guestVote } = require('../../../utilities/guestOperations/customJsonOperations');
const {
  UserFactory, ObjectFactory, PostFactory, CommentFactory,
} = require('../../factories');
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
  describe('on guestVote', async () => {
    describe('on voteOnPost', async () => {
      describe('when vote on steem POST', async () => {
        let validJson,
          voter,
          post,
          wobjects;
        beforeEach(async () => {
          wobjects = await Promise.all(_.times(2, ObjectFactory.Create));
          voter = (await UserFactory.Create()).user;
          post = await PostFactory.Create({
            additionsForMetadata: {
              wobj: {
                wobjects: [
                  ...wobjects.map((w) => ({
                    author_permlink: w.author_permlink, percent: 100 / wobjects.length,
                  })),
                ],
              },
            },
          });
          validJson = {
            required_posting_auths: [mockListBots[0]],
            json: JSON.stringify({
              voter: voter.name,
              author: post.author,
              permlink: post.permlink,
              weight: faker.random.number({ min: -10000, max: 10000 }),
            }),
          };
        });
        describe('on Valid input json', async () => {
          describe('when post exist in STEEM and DB', async () => {
            beforeEach(async () => {
              sinon.stub(postsUtil, 'getPost').returns(post);
              sinon.spy(votePostHelper, 'voteOnPost');
              await guestVote(validJson);
            });
            afterEach(() => {
              votePostHelper.voteOnPost.restore();
              postsUtil.getPost.restore();
            });

            it('should call votePostHelper once', async () => {
              expect(votePostHelper.voteOnPost).to.be.calledOnce;
            });
            it('should add new vote to Post in db', async () => {
              const upd_post = await Post.findOne({ author: post.author, permlink: post.permlink });
              expect(upd_post.active_votes.map((v) => v.voter)).to.include(voter.name);
            });
            it('should add vote post with ZERO weight', async () => {
              const upd_post = await Post.findOne({ author: post.author, permlink: post.permlink });
              const vote = upd_post.active_votes.find((v) => v.voter === voter.name);
              expect(vote.weight).to.be.eq(0);
            });
          });

          describe('when post exist in STEEM but not in DB', async () => {
            beforeEach(async () => {
              post = await PostFactory.Create({
                onlyData: true,
                additionsForMetadata: {
                  wobj: {
                    wobjects: [
                      ...wobjects.map((w) => ({
                        author_permlink: w.author_permlink, percent: 100 / wobjects.length,
                      })),
                    ],
                  },
                },
              });
              validJson = {
                required_posting_auths: [mockListBots[0]],
                json: JSON.stringify({
                  voter: voter.name,
                  author: post.author,
                  permlink: post.permlink,
                  weight: faker.random.number({ min: -10000, max: 10000 }),
                }),
              };

              sinon.stub(postsUtil, 'getPost').returns({ post });
              sinon.spy(votePostHelper, 'voteOnPost');
              await guestVote(validJson);
            });
            afterEach(() => {
              sinon.restore();
            });

            it('should create post in DB', async () => {
              const createdPost = await Post.findOne({
                author: post.author, permlink: post.permlink,
              });
              expect(createdPost).is.exist;
            });
            it('should call votePostHelper once', async () => {
              expect(votePostHelper.voteOnPost).to.be.calledOnce;
            });
            it('should add new vote to Post in db', async () => {
              const updPost = await Post.findOne({ author: post.author, permlink: post.permlink });
              expect(updPost.active_votes.map((v) => v.voter)).to.include(voter.name);
            });
            it('should add vote post with ZERO weight', async () => {
              const updPost = await Post.findOne({ author: post.author, permlink: post.permlink });
              const vote = updPost.active_votes.find((v) => v.voter === voter.name);
              expect(vote.weight).to.be.eq(0);
            });
          });
        });
        describe('on Invalid input json', async () => {
          describe('when post(comment) doesn\'t exist in STEEM', async () => {
            let invalidPost,
              invalidJson;
            beforeEach(async () => {
              invalidPost = await PostFactory.Create({
                onlyData: true,
                additionsForMetadata: {
                  wobj: {
                    wobjects: [
                      ...wobjects.map((w) => ({ author_permlink: w.author_permlink, percent: 100 / wobjects.length })),
                    ],
                  },
                },
              });
              invalidJson = {
                required_posting_auths: [mockListBots[0]],
                json: JSON.stringify({
                  voter: voter.name,
                  author: invalidPost.author,
                  permlink: invalidPost.permlink,
                  weight: faker.random.number({ min: -10000, max: 10000 }),
                }),
              };

              sinon.spy(postsUtil, 'getPost');
              sinon.spy(votePostHelper, 'voteOnPost');
              await guestVote(invalidJson);
            });
            afterEach(() => {
              postsUtil.getPost.restore();
              votePostHelper.voteOnPost.restore();
            });

            it('should not call votePostHelper.voteOnPost', () => {
              expect(votePostHelper.voteOnPost).to.not.been.called;
            });
            it('should call postsUtil.getPost once', () => {
              expect(postsUtil.getPost).to.been.calledOnce;
            });
            it('should not create new post in DB', async () => {
              const createdPost = await Post.findOne(_.pick(invalidPost, ['author', 'permlink']));
              expect(createdPost).to.not.been.exist;
            });
          });
        });
      });

      describe('when vote on steem COMMENT', async () => {
        describe('on Valid input json', async () => {
          describe('when comment exist in STEEM and DB', async () => {
            let validJson,
              voter,
              comment,
              mockSteemComment,
              vote;
            beforeEach(async () => {
              comment = await CommentFactory.Create();
              mockSteemComment = await PostFactory.Create({ onlyData: true, ...comment });
              voter = (await UserFactory.Create()).user;
              vote = { voter: voter.name, weight: faker.random.number({ min: -10000, max: 10000 }) };
              validJson = {
                required_posting_auths: [mockListBots[0]],
                json: JSON.stringify({
                  voter: voter.name,
                  author: comment.author,
                  permlink: comment.permlink,
                  weight: vote.weight,
                }),
              };
              sinon.stub(postsUtil, 'getPost').returns({ post: { ...mockSteemComment, parent_author: comment.parent_author } });
              sinon.spy(votePostHelper, 'voteOnPost');
              await guestVote(validJson);
            });
            afterEach(() => {
              votePostHelper.voteOnPost.restore();
              postsUtil.getPost.restore();
            });

            it('should not call votePostHelper', async () => {
              expect(votePostHelper.voteOnPost).to.not.been.called;
            });
            it('should add new vote to Comment in db', async () => {
              const upd_comment = await Comment.findOne({ author: comment.author, permlink: comment.permlink });
              expect(upd_comment.active_votes.map((v) => v.voter)).to.include(voter.name);
            });
            it('should add vote with correct percent', async () => {
              const upd_comment = await Comment.findOne({ author: comment.author, permlink: comment.permlink });
              const upd_vote = upd_comment.active_votes.find((v) => v.voter === voter.name);
              expect(upd_vote.percent).to.be.eq(vote.weight);
            });
          });

          describe('when post exist in STEEM but not in DB', async () => {
            let validJson,
              voter,
              comment,
              mockSteemComment,
              vote;
            beforeEach(async () => {
              comment = await CommentFactory.Create({ onlyData: true });
              mockSteemComment = await PostFactory.Create({ onlyData: true, ...comment });
              voter = (await UserFactory.Create()).user;
              vote = { voter: voter.name, weight: faker.random.number({ min: -10000, max: 10000 }) };
              validJson = {
                required_posting_auths: [mockListBots[0]],
                json: JSON.stringify({
                  voter: voter.name,
                  author: comment.author,
                  permlink: comment.permlink,
                  weight: vote.weight,
                }),
              };

              sinon.stub(postsUtil, 'getPost').returns({ post: { ...mockSteemComment, parent_author: comment.parent_author } });
              sinon.spy(votePostHelper, 'voteOnPost');
              await guestVote(validJson);
            });
            afterEach(() => {
              votePostHelper.voteOnPost.restore();
              postsUtil.getPost.restore();
            });
            it('should not call votePostHelper', async () => {
              expect(votePostHelper.voteOnPost).to.not.been.called;
            });
            it('should create comment in DB', async () => {
              const createdComment = await Comment.findOne({ author: comment.author, permlink: comment.permlink });
              expect(createdComment).is.exist;
            });
            it('should add new vote to Comment in db', async () => {
              const upd_comment = await Comment.findOne({ author: comment.author, permlink: comment.permlink });
              expect(upd_comment.active_votes.map((v) => v.voter)).to.include(voter.name);
            });
            it('should add vote with correct percent', async () => {
              const upd_comment = await Comment.findOne({ author: comment.author, permlink: comment.permlink });
              const upd_vote = upd_comment.active_votes.find((v) => v.voter === voter.name);
              expect(upd_vote.percent).to.be.eq(vote.weight);
            });
          });
        });
      });
    });
  });
});
