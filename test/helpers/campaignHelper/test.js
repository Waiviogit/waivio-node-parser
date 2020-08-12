const {
  expect, campaignHelper, dropDatabase, faker, CampaignModel,
} = require('../../testHelper');
const { CampaignFactory } = require('../../factories');

describe('Campaign Helper', async () => {
  describe('parseReservationConversation', async () => {
    let campaign, returnedValue, operation, result, user;
    beforeEach(async () => {
      await dropDatabase();
      campaign = await CampaignFactory.Create();
    });
    describe('when function did not find campaign', async () => {
      beforeEach(async () => {
        operation = { author: faker.name.firstName(), parent_permlink: faker.name.firstName() };
        returnedValue = await campaignHelper.parseReservationConversation(operation);
      });
      it('should return true when campaign not found ', async () => {
        expect(returnedValue).to.be.true;
      });
      it('should not find company', async () => {
        ({ result } = await CampaignModel
          .findOne({ users: { $elemMatch: { permlink: operation.parent_permlink } } }));
        expect(result).to.be.null;
      });
    });
    describe('when function found campaign but user did not reserve it', async () => {
      beforeEach(async () => {
        operation = { author: faker.name.firstName(), parent_permlink: campaign.users[0].permlink };
        returnedValue = await campaignHelper.parseReservationConversation(operation);
      });
      it('should return true', async () => {
        expect(returnedValue).to.be.true;
      });
      it('should increment children to 1', async () => {
        ({ result: { users: [user] } } = await CampaignModel
          .findOne({ users: { $elemMatch: { permlink: operation.parent_permlink } } }));
        expect(user.children).to.be.eq(1);
      });
    });
    describe('when function found campaign and user reserved it', async () => {
      beforeEach(async () => {
        operation = { author: campaign.users[0].name, parent_permlink: campaign.users[0].permlink };
        returnedValue = await campaignHelper.parseReservationConversation(operation);
      });
      it('should return false', async () => {
        expect(returnedValue).to.be.false;
      });
      it('should increment children to 1', async () => {
        ({ result: { users: [user] } } = await CampaignModel
          .findOne({ users: { $elemMatch: { permlink: operation.parent_permlink } } }));
        expect(user.children).to.be.eq(1);
      });
    });
  });
});
