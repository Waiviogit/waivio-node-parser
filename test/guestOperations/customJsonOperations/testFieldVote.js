const _ = require('lodash');
const {
  expect, sinon, faker, WObject, UserWobjects, voteFieldHelper, userHelper, AppModel, appHelper,
} = require('test/testHelper');
const { guestVote } = require('utilities/guestOperations/customJsonOperations');
const { UserFactory, AppendObject, userWobjectFactory } = require('test/factories');

describe('customJsonOperations', async () => {
  let mockListBots, blackList;
  beforeEach(async () => {
    blackList = [faker.random.string(), faker.random.string()];
    sinon.stub(AppModel, 'getOne').returns(Promise.resolve({ app: { black_list_users: blackList } }));
    sinon.stub(userHelper, 'checkAndCreateUser').returns({ user: 'its ok' });
    sinon.stub(userHelper, 'checkAndCreateByArray').returns({ user: 'its ok' });
    mockListBots = _.times(5, faker.name.firstName);
    sinon.stub(appHelper, 'getProxyBots').returns(Promise.resolve(mockListBots));
  });
  afterEach(() => {
    sinon.restore();
  });
  describe('on guestVote', async () => {
    describe('on voteOnField', async () => {
      let wobject,
        voter,
        field,
        validJson,
        voterUserWobj,
        creatorUserWobj;
      beforeEach(async () => {
        voter = (await UserFactory.Create()).user;
        const { appendObject, wobject: createdWobj } = await AppendObject.Create();
        wobject = createdWobj;
        field = appendObject;
        voterUserWobj = await userWobjectFactory.Create(
          { user_name: voter.name, author_permlink: wobject.author_permlink },
        );
        creatorUserWobj = await userWobjectFactory.Create(
          { user_name: field.creator, author_permlink: wobject.author_permlink },
        );
        validJson = {
          required_posting_auths: [mockListBots[0]],
          json: JSON.stringify({
            voter: voter.name,
            author: field.author,
            permlink: field.permlink,
            weight: faker.random.number({ min: 0, max: 10000 }),
          }),
        };
      });
      describe('on valid input json', async () => {
        let updWobject,
          updField,
          updVoterUserWobj,
          updCreatorUserWobj;
        beforeEach(async () => {
          sinon.spy(voteFieldHelper, 'voteOnField');
          await guestVote(validJson);
          updWobject = await WObject.findOne({ author_permlink: wobject.author_permlink });
          updField = updWobject.fields.find(
            (f) => f.author === field.author && f.permlink === field.permlink,
          );
          updVoterUserWobj = await UserWobjects.findOne(_.pick(voterUserWobj, ['user_name', 'author_permlink']));
          updCreatorUserWobj = await UserWobjects.findOne(_.pick(creatorUserWobj, ['user_name', 'author_permlink']));
        });
        afterEach(() => {
          voteFieldHelper.voteOnField.restore();
        });
        it('should call voteFieldHelper once', async () => {
          expect(voteFieldHelper.voteOnField).to.be.calledOnce;
        });
        it('should add new vote to Wobj Field in db', async () => {
          expect(updField.active_votes.map((v) => v.voter)).to.include(voter.name);
        });
        it('should not change weight creator in current wobject', async () => {
          expect(updCreatorUserWobj.weight).to.be.eq(creatorUserWobj.weight);
        });
        it('should not change weight voter in current wobject', async () => {
          expect(updVoterUserWobj.weight).to.be.eq(voterUserWobj.weight);
        });
        it('should not change wobject weight', () => {
          expect(wobject.weight).to.be.eq(updWobject.weight);
        });
        it('should decrease field weight on downvote (unpaired vote weight) or increase on upvote (paired vote weight)', () => {
          expect(field.weight).to.be.not.eq(updField.weight);
        });
      });
    });
  });
});
