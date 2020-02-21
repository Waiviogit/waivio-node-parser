const {
  expect, voteFieldHelper, UserWobjects, WobjModel, userHelper, sinon, faker, AppModel,
} = require('test/testHelper');
const { voteAppendObjectMocks } = require('./mocks');

describe('Vote On Field', async () => {
  let blackList;
  beforeEach(async () => {
    blackList = [faker.random.string(), faker.random.string()];
    sinon.stub(AppModel, 'getOne').returns(Promise.resolve({ app: { black_list_users: blackList } }));
    sinon.stub(userHelper, 'checkAndCreateUser').returns({ user: 'its ok' });
  });
  afterEach(async () => {
    sinon.restore();
  });
  describe('when user have weight in wobject', async () => {
    describe('on upVote', async () => {
      let mocks;
      let updField,
        exstField;
      beforeEach(async () => {
        mocks = await voteAppendObjectMocks();
        const { field } = await WobjModel.getField(
          mocks.appendObject.author, mocks.appendObject.permlink, mocks.author_permlink,
        );
        exstField = field;
        await voteFieldHelper.voteOnField({
          author: mocks.appendObject.author,
          permlink: mocks.appendObject.permlink,
          voter: mocks.voter.name,
          percent: 10000,
          author_permlink: mocks.author_permlink,
          weight: 100,
          rshares_weight: 1000,
        });
        updField = (await WobjModel.getField(
          mocks.appendObject.author, mocks.appendObject.permlink, mocks.author_permlink,
        )).field;
      });
      it('should increase field weight by correct value', async () => {
        const diff = updField.weight - exstField.weight;
        expect(diff).to.eq(100 + (1000 * 0.25));
      });
      it('should increase creator weight by correct value', async () => {
        const creatorWeight = await UserWobjects
          .findOne({ user_name: mocks.creator.name, author_permlink: mocks.author_permlink });
        expect(creatorWeight.weight).to.eq(1000 * 0.75);
      });
      it('should increase voter weight by correct value', async () => {
        const voterWeight = await UserWobjects.findOne(
          { user_name: mocks.voter.name, author_permlink: mocks.author_permlink },
        );
        expect(voterWeight.weight).to.eq(1000 * 0.25);
      });
      it('should not create duplicates on active_votes', async () => {
        const countVotesByVoter = updField.active_votes.filter(
          (vote) => vote.voter === mocks.voter.name,
        ).length;
        expect(countVotesByVoter).to.eq(1);
      });
    });
    describe('on downVote', async () => {
      /*
            Usually down vote indicate as negative value of "percent", but on appends we use another system,
            to keep reputations of ours bots, we improve downVotes as upVotes, but with not integer value,
            for example: UpVote with percent value 98 00 is still upVote, but if value not integer, like 98 50 - it
            becomes calculate as downVote with value 99 (round value to upper if 50, and to lower if 49)
             */
      let mocks, updField, exstField;

      beforeEach(async () => {
        mocks = await voteAppendObjectMocks();
        const { field } = await WobjModel.getField(
          mocks.appendObject.author, mocks.appendObject.permlink, mocks.author_permlink,
        );

        exstField = field;
        await voteFieldHelper.voteOnField({
          author: mocks.appendObject.author,
          permlink: mocks.appendObject.permlink,
          voter: mocks.voter.name,
          percent: 9995, // should be rounded to - 100 percent
          author_permlink: mocks.author_permlink,
          weight: 100,
          rshares_weight: 1000,
        });

        const { field: newField } = await WobjModel.getField(
          mocks.appendObject.author, mocks.appendObject.permlink, mocks.author_permlink,
        );
        updField = newField;
      });
      afterEach(async () => {
        sinon.restore();
      });
      it('should decrease field weight by correct value', async () => {
        const diff = updField.weight - exstField.weight;
        expect(diff).to.eq(-350);
      });
      it('should decrease creator weight by correct value', async () => {
        const creatorWeight = await UserWobjects.findOne(
          { user_name: mocks.creator.name, author_permlink: mocks.author_permlink },
        );
        expect(creatorWeight.weight).to.eq(1000 * 0.75 * -1);
      });
      it('should not create voter user_wobject doc', async () => {
        const voterWeight = await UserWobjects.findOne(
          { user_name: mocks.voter.name, author_permlink: mocks.author_permlink },
        );
        expect(voterWeight).to.not.exist;
      });

      it('should not create duplicates on active_votes', async () => {
        const countVotesByVoter = updField.active_votes.filter(
          (vote) => vote.voter === mocks.voter.name,
        ).length;
        expect(countVotesByVoter).to.eq(1);
      });
    });
    describe('on unVote after upVote', async () => {
      /*
            Usually down vote indicate as negative value of "percent", but on appends we use another system,
            to keep reputations of ours bots, we improve downVotes as upVotes, but with not integer value,
            for example: upvote with percent value 98 00 is still upVote, but if value not integer, like 98 50 - it
            becomes calculate as downVote with value 99 (round value to upper if 50, and to lower if 49)
             */
      let mocks;
      let updField,
        exstField;

      beforeEach(async () => {
        mocks = await voteAppendObjectMocks();
        await voteFieldHelper.voteOnField({
          author: mocks.appendObject.author,
          permlink: mocks.appendObject.permlink,
          voter: mocks.voter.name,
          percent: mocks.vote.percent, // should be rounded to - 100 percent
          author_permlink: mocks.author_permlink,
          weight: 100,
          rshares_weight: 1000,
        });
        const { field } = await WobjModel.getField(
          mocks.appendObject.author, mocks.appendObject.permlink, mocks.author_permlink,
        );

        exstField = field;
        await voteFieldHelper.voteOnField({
          author: mocks.appendObject.author,
          permlink: mocks.appendObject.permlink,
          voter: mocks.voter.name,
          percent: 0, // should be rounded to - 100 percent
          author_permlink: mocks.author_permlink,
          rshares_weight: 0,
        });
        updField = (await WobjModel.getField(
          mocks.appendObject.author, mocks.appendObject.permlink, mocks.author_permlink,
        )).field;
      });
      it('should decrease field weight by correct value', async () => {
        const diff = updField.weight - exstField.weight;
        expect(diff).to.eq(-(100 + (1000 * 0.25)));
      });
      it('should decrease creator weight by correct value', async () => {
        const creatorWeight = await UserWobjects.findOne(
          { user_name: mocks.creator.name, author_permlink: mocks.author_permlink },
        );
        expect(creatorWeight.weight).to.eq(0);
      });
      it('should decrease voter weight by correct value', async () => {
        const voterWeight = await UserWobjects.findOne(
          { user_name: mocks.voter.name, author_permlink: mocks.author_permlink },
        );
        expect(voterWeight.weight).to.eq(0);
      });
    });
    describe('on unVote after downVote', async () => {
      /*
            Usually down vote indicate as negative value of "percent", but on appends we use another system,
            to keep reputations of ours bots, we improve downVotes as upVotes, but with not integer value,
            for example: upvote with percent value 98 00 is still upVote, but if value not integer, like 98 50 - it
            becomes calculate as downVote with value 99 (round value to upper if 50, and to lower if 49)
             */
      let mocks, updField, exstField;

      beforeEach(async () => {
        mocks = await voteAppendObjectMocks();
        await voteFieldHelper.voteOnField({
          author: mocks.appendObject.author,
          permlink: mocks.appendObject.permlink,
          voter: mocks.voter.name,
          percent: 9995, // should be rounded to - 100 percent
          author_permlink: mocks.author_permlink,
          weight: 100,
          rshares_weight: 1000,
        });
        const { field } = await WobjModel.getField(
          mocks.appendObject.author, mocks.appendObject.permlink, mocks.author_permlink,
        );

        exstField = field;
        await voteFieldHelper.voteOnField({
          author: mocks.appendObject.author,
          permlink: mocks.appendObject.permlink,
          voter: mocks.voter.name,
          percent: 0, // should be rounded to - 100 percent
          author_permlink: mocks.author_permlink,
          rshares_weight: 0,
        });
        const { field: newField } = await WobjModel.getField(
          mocks.appendObject.author, mocks.appendObject.permlink, mocks.author_permlink,
        );

        updField = newField;
      });
      it('should increase field weight by 100', async () => {
        const diff = updField.weight - exstField.weight;
        expect(diff).to.eq(350);
      });
      it('should increase creator weight and became 0', async () => {
        const creatorWeight = await UserWobjects.findOne(
          { user_name: mocks.creator.name, author_permlink: mocks.author_permlink },
        );

        expect(creatorWeight.weight).to.eq(0);
      });
    });
  });
});
