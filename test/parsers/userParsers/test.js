const _ = require('lodash');
const {
  userParsers, User, expect, sinon, Post, faker, userHelper, dropDatabase, Subscriptions, WobjectSubscriptions,
} = require('test/testHelper');
const {
  UserFactory, PostFactory, SubscriptionsFactory, WobjectSubscriptionsFactory,
} = require('test/factories');
const { User: UserModel, Post: PostModel } = require('models');
const { BELL_NOTIFICATIONS } = require('constants/parsersData');

describe('UserParsers', async () => {
  describe('on updateAccountParse', async () => {
    describe('on update json_metadata', async () => {
      let updUser;
      const mockMetadata = {
        profile: {
          name: faker.name.firstName(),
          profile_image: faker.random.string(20),
        },
      };
      const postingMetadata = JSON.stringify({ a: 1, b: 2 });

      beforeEach(async () => {
        const { user: mockUser } = await UserFactory.Create({
          posting_json_metadata: postingMetadata,
        });

        await userParsers.updateAccountParser({
          account: mockUser.name,
          json_metadata: JSON.stringify(mockMetadata),
          posting_json_metadata: '',
        });
        updUser = await User.findOne({ name: mockUser.name }).lean();
      });

      it('should update json_metadata correct', () => {
        expect(updUser.json_metadata).to.equal(JSON.stringify(mockMetadata));
      });
      it('should not update posting metadata', () => {
        expect(updUser.posting_json_metadata).to.eq(postingMetadata);
      });
      it('should update existing account and add alias key', () => {
        expect(updUser).to.include.key('alias');
      });
      it('should update alias name correct', () => {
        expect(updUser.alias).to.equal(mockMetadata.profile.name);
      });
      it('should update "profile_image" correct', () => {
        expect(updUser.profile_image).to.equal(mockMetadata.profile.profile_image);
      });
      it('shouldn\'t create user if update was on non exist user', async () => {
        await userParsers.updateAccountParser({
          account: 'nonexistuser',
          json_metadata: '{hello: world}',
        });
        const user = await User.findOne({ name: 'nonexistuser' });

        expect(user).to.not.exist;
      });
    });

    describe('on update posting_json_metadata', async () => {
      let updUser;
      const mockMetadata = {
        profile: {
          name: faker.name.firstName(),
          profile_image: faker.random.string(20),
        },
      };
      const jsonMetadata = JSON.stringify({ a: 1, b: 2, c: 4 });

      beforeEach(async () => {
        const { user: mockUser } = await UserFactory.Create({ json_metadata: jsonMetadata });

        await userParsers.updateAccountParser({
          account: mockUser.name,
          json_metadata: '',
          posting_json_metadata: JSON.stringify(mockMetadata),
        });
        updUser = await User.findOne({ name: mockUser.name }).lean();
      });

      it('should update posting_json_metadata correct', () => {
        expect(updUser.posting_json_metadata).to.equal(JSON.stringify(mockMetadata));
      });
      it('should not update casual json_metadata', () => {
        expect(updUser.json_metadata).to.be.eq(jsonMetadata);
      });

      it('should update existing account and add alias key', () => {
        expect(updUser).to.include.key('alias');
      });
      it('should update alias name correct', () => {
        expect(updUser.alias).to.equal(mockMetadata.profile.name);
      });
      it('should update "profile_image" correct', () => {
        expect(updUser.profile_image).to.equal(mockMetadata.profile.profile_image);
      });
      it('shouldn\'t create user if update was on non exist user', async () => {
        const name = faker.name.firstName();
        await userParsers.updateAccountParser({
          account: name,
          json_metadata: '',
          json_metadata_metadata: '{hello: world}',
        });
        const user = await User.findOne({ name });

        expect(user).to.not.exist;
      });
    });
  });

  describe('on followUserParser', async () => {
    describe('on valid input data', async () => {
      let usr, usr2, following, unfollowing;

      beforeEach(async () => {
        await dropDatabase();
        following = (await UserFactory.Create()).user.name;
        unfollowing = (await UserFactory.Create()).user.name;
        await UserFactory.Create({ name: following });
        await UserFactory.Create({ name: unfollowing });

        usr = (await UserFactory.Create()).user;
        usr2 = (await UserFactory.Create({ users_follow: [unfollowing] })).user;

        await userParsers.followUserParser({
          required_posting_auths: [usr.name],
          json: JSON.stringify([
            'follow',
            {
              follower: usr.name,
              following,
              what: ['blog'],
            },
          ]),
        });
        await userParsers.followUserParser({
          required_posting_auths: [usr2.name],
          json: JSON.stringify([
            'follow',
            {
              follower: usr2.name,
              following: unfollowing,
              what: [],
            },
          ]),
        });
        await userParsers.followUserParser({
          required_posting_auths: [usr2.name],
          json: JSON.stringify([
            'follow',
            {
              follower: usr2.name,
              following: faker.name.firstName(),
              what: ['ignore'],
            },
          ]),
        });
      });
      it('should add user to follow list', async () => {
        const result = await Subscriptions.findOne({ follower: usr.name, following }).lean();
        expect(result).to.be.exist;
      });
      it('should increase follower counters at following user', async () => {
        const user = await User.findOne({ name: following }).lean();
        expect(user.followers_count).to.be.eq(1);
      });
      it('should decrease followers counters with unfollow operation ', async () => {
        const user = await User.findOne({ name: usr2.name }).lean();
        expect(user.followers_count).to.be.eq(0);
      });
      it('should remove user from follow list', async () => {
        const result = await Subscriptions.find({ follower: usr2.name }).lean();
        expect(result).to.be.empty;
      });
    });

    describe('if first param in JSON is "reblog"', async () => {
      let mockJson,
        reblogParserStub,
        addUserFollowStub,
        removeUserFollowStub;
      beforeEach(async () => {
        reblogParserStub = sinon.stub(userParsers, 'reblogPostParser').returns(0);
        addUserFollowStub = sinon.stub(UserModel, 'addUserFollow').returns({});
        removeUserFollowStub = sinon.stub(UserModel, 'removeUserFollow').returns({});
        mockJson = ['reblog', {
          account: faker.name.firstName(),
          author: faker.name.firstName(),
          permlink: faker.random.string(15),
        }];
        await userParsers.followUserParser({
          json: JSON.stringify(mockJson),
          required_posting_auths: [mockJson[1].account],
        });
      });
      afterEach(() => {
        reblogParserStub.restore();
        addUserFollowStub.restore();
        removeUserFollowStub.restore();
      });

      it('should call "reblogPostParser" once', () => {
        expect(reblogParserStub).to.be.called;
      });

      it('should call "reblogPostParser" with correct params', () => {
        expect(reblogParserStub).to.be.calledWith({ json: mockJson, account: mockJson[1].account });
      });

      it('should not call addUserFollow on user model', () => {
        expect(addUserFollowStub).to.be.not.called;
      });

      it('should not call removeUserFollow on user model', () => {
        expect(removeUserFollowStub).to.be.not.called;
      });
    });
  });

  describe('on reblogPostParser', async () => {
    describe('on valid json', async () => {
      let post,
        user,
        reblogPost,
        updSourcePost,
        mockInput;
      beforeEach(async () => {
        sinon.stub(userHelper, 'checkAndCreateUser').returns({ user: 'its ok' });
        const { user: userMock } = await UserFactory.Create();
        user = userMock;
        post = await PostFactory.Create({
          reblogged: [user.name],
          additionsForPost: {
            wobjects: [
              { author_permlink: faker.random.string(10), percent: 50 },
              { author_permlink: faker.random.string(10), percent: 50 },
            ],
            language: 'ru-RU',
          },
        });
        mockInput = {
          json: ['reblog', { account: user.name, author: post.author, permlink: post.permlink }],
          account: user.name,
        };
        await userParsers.reblogPostParser(mockInput);
        updSourcePost = await Post.findOne({ author: post.author, permlink: post.permlink }).lean();
        reblogPost = await Post.findOne({
          author: user.name,
          permlink: `${post.author}/${post.permlink}`,
        }).lean();
      });
      afterEach(async () => {
        sinon.restore();
      });
      it('should create new post with field reblog_to not null', () => {
        expect(reblogPost.reblog_to).to.not.null;
      });
      it('should create new post with correct field reblog_to', () => {
        expect(reblogPost.reblog_to).to.deep.eq(_.pick(post, ['author', 'permlink']));
      });
      it('should not edit source post', async () => {
        expect(_.omit(post, 'updatedAt')).to.deep.eq(_.omit(updSourcePost, 'updatedAt'));
      });
      it('should duplicate all source post wobjects', () => {
        expect(reblogPost.wobjects).to.deep.eq(post.wobjects);
      });
      it('should duplicate source post language', () => {
        expect(reblogPost.language).to.eq(post.language);
      });
      it('should update source post field reblogged_users', async () => {
        expect(updSourcePost.reblogged_users).to.contain(user.name);
      });
    });
    describe('on invalid json', async () => {
      let user,
        mockInput;
      beforeEach(async () => {
        const { user: userMock } = await UserFactory.Create();
        user = userMock;
        mockInput = {
          json: ['reblog', {
            account: user.name,
            author: faker.random.string(10),
            permlink: faker.random.string(10),
          }],
          account: user.name,
        };
        sinon.spy(PostModel, 'create');
        sinon.spy(PostModel, 'update');
      });
      afterEach(async () => {
        sinon.restore();
      });
      it('should not call method create post with invalid input', async () => {
        await userParsers.reblogPostParser({});
        expect(PostModel.create).to.be.not.called;
      });
      it('should not call method update post with invalid input', async () => {
        await userParsers.reblogPostParser({});
        expect(PostModel.update).to.be.not.called;
      });
      it('should not create reblogged post if FindOne method throws error', async () => {
        sinon.stub(Post, 'findOne').throws({ message: faker.random.string(10) });
        await userParsers.reblogPostParser(mockInput);
        expect(PostModel.create).to.be.not.called;
      });
    });
  });

  describe('on subscribeNotificationsParser', async () => {
    describe('on valid input data', async () => {
      let uSubs1, uSubs2, wSubs1, wSubs2, bell;
      beforeEach(async () => {
        await dropDatabase();
        uSubs1 = await SubscriptionsFactory.Create();
        uSubs2 = await SubscriptionsFactory.Create();
        wSubs1 = await WobjectSubscriptionsFactory.Create();
        wSubs2 = await WobjectSubscriptionsFactory.Create();
        const arr = [
          { subs: uSubs1, subscribe: true, id: BELL_NOTIFICATIONS.USER },
          { subs: uSubs2, subscribe: false, id: BELL_NOTIFICATIONS.USER },
          { subs: wSubs1, subscribe: true, id: BELL_NOTIFICATIONS.WOBJECT },
          { subs: wSubs2, subscribe: false, id: BELL_NOTIFICATIONS.WOBJECT },
        ];
        for (const el of arr) {
          await userParsers.subscribeNotificationsParser({
            required_posting_auths: [el.subs.follower],
            json: JSON.stringify([
              el.id,
              {
                follower: el.subs.follower,
                following: el.subs.following,
                subscribe: el.subscribe,
              },
            ]),
          });
        }
      });
      it('user bell should be true', async () => {
        ({ bell } = await Subscriptions
          .findOne({ follower: uSubs1.follower, following: uSubs1.following }).lean());
        expect(bell).to.be.true;
      });
      it('user bell should be false', async () => {
        ({ bell } = await Subscriptions
          .findOne({ follower: uSubs2.follower, following: uSubs2.following }).lean());
        expect(bell).to.be.false;
      });
      it('wobject bell should be true', async () => {
        ({ bell } = await WobjectSubscriptions
          .findOne({ follower: wSubs1.follower, following: wSubs1.following }).lean());
        expect(bell).to.be.true;
      });
      it('wobject bell should be false', async () => {
        ({ bell } = await WobjectSubscriptions
          .findOne({ follower: wSubs2.follower, following: wSubs2.following }).lean());
        expect(bell).to.be.false;
      });
    });
  });
});
