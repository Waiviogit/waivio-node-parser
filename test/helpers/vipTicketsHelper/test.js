const {
  expect, faker, vipTicketsHelper, sinon, redis
} = require('test/testHelper');

const { redisQueue } = require('utilities/redis/rsmq');
const _ = require('lodash');
const { transferData } = require('./mocks');

describe('On processTicketPurchase', async () => {
  beforeEach(async () => {
      // await redis.actionsDataClient.flushdbAsync();
  });
  afterEach(() => {
    sinon.restore();
  });
  let result;
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

  });
});
