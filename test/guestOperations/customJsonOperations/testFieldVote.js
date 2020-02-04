const _ = require('lodash');
const {
  expect, sinon, faker, WObject, UserWobjects, voteFieldHelper,
} = require('../../testHelper');
const { guestVote } = require('../../../utilities/guestOperations/customJsonOperations');
const { UserFactory, AppendObject, userWobjectFactory } = require('../../factories');
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
        voterUserWobj = await userWobjectFactory.Create({ user_name: voter.name, author_permlink: wobject.author_permlink });
        creatorUserWobj = await userWobjectFactory.Create({ user_name: field.creator, author_permlink: wobject.author_permlink });
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
        let upd_wobject,
          upd_field,
          updVoterUserWobj,
          updCreatorUserWobj;
        beforeEach(async () => {
          sinon.spy(voteFieldHelper, 'voteOnField');
          await guestVote(validJson);
          upd_wobject = await WObject.findOne({ author_permlink: wobject.author_permlink });
          upd_field = upd_wobject.fields.find((f) => f.author === field.author && f.permlink === field.permlink);
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
          expect(upd_field.active_votes.map((v) => v.voter)).to.include(voter.name);
        });
        it('should not change weight creator in current wobject', async () => {
          expect(updCreatorUserWobj.weight).to.be.eq(creatorUserWobj.weight);
        });
        it('should not change weight voter in current wobject', async () => {
          expect(updVoterUserWobj.weight).to.be.eq(voterUserWobj.weight);
        });
        it('should not change wobject weight', () => {
          expect(wobject.weight).to.be.eq(upd_wobject.weight);
        });
        it('should not change field weight', () => {
          expect(field.weight).to.be.eq(upd_field.weight);
        });
      });
    });
  });
});
