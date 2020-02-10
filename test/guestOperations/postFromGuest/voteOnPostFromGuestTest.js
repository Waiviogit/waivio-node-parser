const _ = require('lodash');
const {
  expect, sinon, faker, Post, votePostHelper, UserWobjects, User, WObject, ObjectType,
} = require('../../testHelper');
const constants = require('../../../utilities/constants');
const mocksForVotePost = require('./mocksForVotePost');

describe('On votePostHelper', async () => {
  let mockListBots;
  beforeEach(async () => {
    mockListBots = _.times(5, faker.name.firstName);
    sinon.stub(constants, 'WAIVIO_PROXY_BOTS').value(mockListBots);
  });
  afterEach(() => {
    sinon.restore();
  });
  describe('when vote on post written by guest user', async () => {
    let mocks,
      updPost,
      updVoter,
      updAuthor;
    beforeEach(async () => {
      mocks = await mocksForVotePost({ proxyBot: mockListBots[0] });
    });
    describe('on valid input', async () => {
      beforeEach(async () => {
        await votePostHelper.voteOnPost({
          post: mocks.post,
          voter: mocks.user_voter.name,
          metadata: mocks.metadata,
          percent: 10000,
        });
        updPost = await Post.findOne({ author: mocks.post.author, permlink: mocks.post.permlink });
        updVoter = await User.findOne({ name: mocks.user_voter.name });
        updAuthor = await User.findOne({ name: mocks.guest_author.name });
      });
      it('should add vote to post', async () => {
        const vote = updPost.active_votes.find((v) => v.voter === mocks.user_voter.name);
        expect(vote).to.exist;
      });
      for (const idx of [0, 1, 2, 3, 4]) {
        // eslint-disable-next-line no-loop-func
        describe(`For wobject ${idx + 1} `, async () => {
          let wobject,
            userWobjAuthor,
            userWobjVoter,
            objectType,
            updType,
            updWobject;

          beforeEach(async () => {
            wobject = mocks.wobjects[idx];
            userWobjAuthor = await UserWobjects.findOne({
              user_name: updAuthor.name,
              author_permlink: wobject.author_permlink,
            }).lean();
            userWobjVoter = await UserWobjects.findOne({
              user_name: updVoter.name,
              author_permlink: wobject.author_permlink,
            }).lean();
            objectType = mocks.object_types.find((t) => t.name === wobject.object_type);
            updType = await ObjectType.findOne({ name: wobject.object_type }).lean();
            updWobject = await WObject.findOne({ author_permlink: wobject.author_permlink });
          });

          it('should create user_wobject docs for author', async () => {
            expect(userWobjAuthor).to.exist;
          });

          it('should create user_wobjects docs for author with correct weight', async () => {
            expect(userWobjAuthor.weight).to.eq(
              Number((Math.round(mocks.vote.rshares * 1e-6) * 0.2 * 0.75).toFixed(3)),
            ); // 0.2 because 5 wobjects on post
          });

          it('should create user_wobjects docs for voter', () => {
            expect(userWobjVoter).to.exist;
          });

          it('should create user_wobjects docs for voter with correct weight', () => {
            expect(userWobjVoter.weight).to.eq(
              Number((Math.round(mocks.vote.rshares * 1e-6) * 0.2 * 0.25).toFixed(3)),
            );
          });

          it('should create voter wobjects_weight as a sum of all wobjects weights', async () => {
            let sum = 0;
            for (const wobj of mocks.wobjects) {
              sum += (await UserWobjects.findOne({
                user_name: updVoter.name,
                author_permlink: wobj.author_permlink,
              }).lean()).weight;
            }
            expect(updVoter.wobjects_weight).to.eq(sum);
          });

          it('should create author wobjects_weight as a sum of all wobjects weights', async () => {
            let sum = 0;
            for (const wobj of mocks.wobjects) {
              sum += (await UserWobjects.findOne({
                user_name: updAuthor.name,
                author_permlink: wobj.author_permlink,
              }).lean()).weight;
            }
            expect(updAuthor.wobjects_weight).to.eq(sum);
          });

          it('should correctly update wobject weight', async () => {
            const weight_diff = updWobject.weight - wobject.weight;
            expect(weight_diff).to.eq(Number((Math.round(mocks.vote.rshares * 1e-6) / 5).toFixed(3)));
          });

          it('should correctly update ObjectTypes weights', async () => {
            const weight_diff = updType.weight - objectType.weight;
            const expected = Number((Math.round(mocks.vote.rshares * 1e-6) / 5).toFixed(3));

            expect(weight_diff).to.eq(expected);
          });
        });
      }
    });
  });
});
