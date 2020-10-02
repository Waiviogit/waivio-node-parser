const {
  expect, votePostHelper, UserWobjects, User, WObject, ObjectType, faker, Post, AppModel, sinon,
} = require('test/testHelper');
const votePostMocks = require('./mocks');

describe('VoteParser', () => {
  let blackList;
  beforeEach(async () => {
    blackList = [faker.random.string(), faker.random.string()];
    sinon.stub(AppModel, 'findOne').returns(Promise.resolve({ result: { black_list_users: blackList } }));
  });
  afterEach(async () => {
    sinon.restore();
  });
  describe(' On Post helper voteOnPost', async () => {
    let mocks, updAuthor, updVoter;

    describe('on valid input data', async () => {
      beforeEach(async () => {
        mocks = await votePostMocks();
        await votePostHelper.voteOnPost({
          post: mocks.post, voter: mocks.user_voter.name, metadata: mocks.metadata, percent: 10000,
        });
        updAuthor = await User.findOne({ name: mocks.user_author.name }).lean();
        updVoter = await User.findOne({ name: mocks.user_voter.name }).lean();
      });

      for (const idx of [0, 1, 2, 3, 4]) {
        describe(`For wobject ${idx + 1} `, async () => {
          let wobject, userWobjAuthor, userWobjVoter, object_type;

          beforeEach(async () => {
            wobject = mocks.wobjects[idx];
            userWobjAuthor = await UserWobjects.findOne(
              { user_name: updAuthor.name, author_permlink: wobject.author_permlink },
            ).lean();
            userWobjVoter = await UserWobjects.findOne(
              { user_name: updVoter.name, author_permlink: wobject.author_permlink },
            ).lean();
            object_type = mocks.object_types.find((t) => t.name === wobject.object_type);
          });

          it('should create user_wobject docs for author', async () => {
            expect(userWobjAuthor).to.exist;
          });

          it('should create user_wobjects docs for author with correct weight', async () => {
            expect(userWobjAuthor.weight).to.eq(
              Number((Math.round(mocks.vote.rshares * 1e-6) * 0.2 * 0.75).toFixed(3)),
            );
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
              sum += (await UserWobjects.findOne(
                { user_name: updVoter.name, author_permlink: wobj.author_permlink },
              ).lean()).weight;
            }
            expect(updVoter.wobjects_weight).to.eq(sum);
          });

          it('should create author wobjects_weight as a sum of all wobjects weights', async () => {
            let sum = 0;

            for (const wobj of mocks.wobjects) {
              sum += (await UserWobjects.findOne(
                { user_name: updAuthor.name, author_permlink: wobj.author_permlink },
              ).lean()).weight;
            }
            expect(updAuthor.wobjects_weight).to.eq(sum);
          });

          it('should correctly update wobject weight', async () => {
            const updWobject = await WObject.findOne({ author_permlink: wobject.author_permlink });
            const weightDiff = updWobject.weight - wobject.weight;

            expect(weightDiff).to.eq(Number(
              (Math.round(mocks.vote.rshares * 1e-6) / 5).toFixed(3),
            ));
          });

          it('should correctly update ObjectTypes weights', async () => {
            const updType = await ObjectType.findOne({ name: wobject.object_type }).lean();
            const weightDiff = updType.weight - object_type.weight;
            const expected = Number((Math.round(mocks.vote.rshares * 1e-6) / 5).toFixed(3));

            expect(weightDiff).to.eq(expected);
          });
          it('should add vote to active_votes', async () => {
            const updPost = await Post.findOne(
              { author: mocks.post.author, permlink: mocks.post.permlink },
            );
            expect(updPost.active_votes[0]).to.exist;
          });
        });
      }
      it('test', () => {});
    });

    describe('if voter from blackList', async () => {
      beforeEach(async () => {
        mocks = await votePostMocks({
          voter: blackList[0],
        });
        await votePostHelper.voteOnPost({
          post: mocks.post,
          voter: mocks.user_voter.name,
          metadata: mocks.metadata,
          percent: 10000,
        });
        updAuthor = await User.findOne({ name: mocks.user_author.name }).lean();
        updVoter = await User.findOne({ name: mocks.user_voter.name }).lean();
      });
      for (const idx of [0, 1, 2, 3, 4]) {
        describe(`For wobject ${idx + 1} `, async () => {
          let wobject, userWobjAuthor, userWobjVoter, object_type;

          beforeEach(async () => {
            wobject = mocks.wobjects[idx];
            userWobjAuthor = await UserWobjects.findOne(
              { user_name: updAuthor.name, author_permlink: wobject.author_permlink },
            ).lean();
            userWobjVoter = await UserWobjects.findOne(
              { user_name: updVoter.name, author_permlink: wobject.author_permlink },
            ).lean();
            object_type = mocks.object_types.find((t) => t.name === wobject.object_type);
          });

          it('should not create user_wobject docs for author', async () => {
            expect(userWobjAuthor).to.not.exist;
          });

          it('should not create user_wobjects docs for voter', () => {
            expect(userWobjVoter).to.not.exist;
          });

          it('should not create voter wobjects_weight as a sum of all wobjects weights', async () => {
            expect(updVoter.wobjects_weight).to.eq(0);
          });

          it('should not create author wobjects_weight as a sum of all wobjects weights', async () => {
            expect(updAuthor.wobjects_weight).to.eq(0);
          });

          it('should not update wobject weight', async () => {
            const updWobject = await WObject.findOne({ author_permlink: wobject.author_permlink });
            const weightDiff = updWobject.weight - wobject.weight;

            expect(weightDiff).to.eq(0);
          });

          it('should not update ObjectTypes weights', async () => {
            const updType = await ObjectType.findOne({ name: wobject.object_type }).lean();
            const weightDiff = updType.weight - object_type.weight;

            expect(weightDiff).to.eq(0);
          });

          it('should add vote to active_votes', async () => {
            const updPost = await Post.findOne(
              { author: mocks.post.author, permlink: mocks.post.permlink },
            );
            expect(updPost.active_votes[0]).to.exist;
          });
        });
      }
      it('test', () => {});
    });

    describe('if author from blackList', async () => {
      beforeEach(async () => {
        mocks = await votePostMocks({
          author: blackList[0],
        });
        await votePostHelper.voteOnPost({
          post: mocks.post,
          voter: mocks.user_voter.name,
          metadata: mocks.metadata,
          percent: 10000,
        });
        updAuthor = await User.findOne({ name: mocks.user_author.name }).lean();
        updVoter = await User.findOne({ name: mocks.user_voter.name }).lean();
      });
      for (const idx of [0, 1, 2, 3, 4]) {
        describe(`For wobject ${idx + 1} `, async () => {
          let wobject,
            userWobjAuthor,
            userWobjVoter,
            object_type;

          beforeEach(async () => {
            wobject = mocks.wobjects[idx];
            userWobjAuthor = await UserWobjects.findOne(
              { user_name: updAuthor.name, author_permlink: wobject.author_permlink },
            ).lean();
            userWobjVoter = await UserWobjects.findOne(
              { user_name: updVoter.name, author_permlink: wobject.author_permlink },
            ).lean();
            object_type = mocks.object_types.find((t) => t.name === wobject.object_type);
          });

          it('should not create user_wobject docs for author', async () => {
            expect(userWobjAuthor).to.not.exist;
          });

          it('should not create user_wobjects docs for voter', () => {
            expect(userWobjVoter).to.not.exist;
          });

          it('should not create voter wobjects_weight as a sum of all wobjects weights', async () => {
            expect(updVoter.wobjects_weight).to.eq(0);
          });

          it('should not create author wobjects_weight as a sum of all wobjects weights', async () => {
            expect(updAuthor.wobjects_weight).to.eq(0);
          });

          it('should not update wobject weight', async () => {
            const updWobject = await WObject.findOne({ author_permlink: wobject.author_permlink });
            const weightDiff = updWobject.weight - wobject.weight;

            expect(weightDiff).to.eq(0);
          });

          it('should not update ObjectTypes weights', async () => {
            const updType = await ObjectType.findOne({ name: wobject.object_type }).lean();
            const weightDiff = updType.weight - object_type.weight;

            expect(weightDiff).to.eq(0);
          });

          it('should add vote to active_votes', async () => {
            const updPost = await Post.findOne(
              { author: mocks.post.author, permlink: mocks.post.permlink },
            );
            expect(updPost.active_votes[0]).to.exist;
          });
        });
      }
      it('test', () => {});
    });
  });
});
