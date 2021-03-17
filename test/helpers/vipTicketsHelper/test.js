const {
  expect, vipTicketsHelper, sinon, redis,
} = require('test/testHelper');
const { redisQueue, rsmqClient } = require('utilities/redis/rsmq');
const { Q_NAME } = require('constants/vipTicketsData');
const _ = require('lodash');
const { transferData } = require('./mocks');

describe('On processTicketPurchase', async () => {
  let result, message, data, parcedMessage;
  beforeEach(async () => {
    await redis.postRefsClient.flushdbAsync();
  });
  afterEach(async () => {
    await redis.postRefsClient.flushdbAsync();
    sinon.restore();
  });
  describe('On errors', async () => {
    it('should return false when receive HBD', async () => {
      result = await vipTicketsHelper
        .processTicketPurchase(transferData({ amount: `${_.random(0, 50)} HBD` }));
      expect(result).to.be.false;
    });

    it('should return false when not enough HIVE to buy ticket', async () => {
      result = await vipTicketsHelper
        .processTicketPurchase(transferData({ amount: `${_.random(0, 4.49)} HIVE` }));
      expect(result).to.be.false;
    });

    it('should return false when can\'t create queue', async () => {
      sinon.stub(redisQueue, 'sendMessage').returns(Promise.resolve({ error: 'error' }));
      result = await vipTicketsHelper.processTicketPurchase(transferData());
      expect(result).to.be.false;
    });

    it('should return false when can\'t send message to queue', async () => {
      sinon.stub(redisQueue, 'createQueue').returns(Promise.resolve({ error: 'error' }));
      result = await vipTicketsHelper.processTicketPurchase(transferData());
      expect(result).to.be.false;
    });
  });

  describe('On valid data', async () => {
    beforeEach(async () => {
      data = transferData();
      result = await vipTicketsHelper.processTicketPurchase(data);
      ({ message } = await rsmqClient.receiveMessageAsync({ qname: Q_NAME, vt: 0 }));
      parcedMessage = JSON.parse(message);
    });
    it('should be the same data in message', async () => {
      expect(_.omit(parcedMessage, ['ticketsAmount'])).to.be.deep.eq(data);
    });

    it('should ticketsAmount be number of ticket gt 0', async () => {
      expect(parcedMessage.ticketsAmount).to.be.greaterThan(0);
    });

    it('should ticketsAmount be integer', async () => {
      expect(parcedMessage.ticketsAmount).to.satisfy(Number.isInteger);
    });
  });
});
