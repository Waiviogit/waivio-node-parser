const { expect, faker, sinon } = require('../../testHelper');
const { validateProxyBot, getFromMetadataGuestInfo } = require('../../../utilities/guestOperations/guestHelpers');
const constants = require('../../../utilities/constants');

describe('guestHelpers', async () => {
  describe('on validateProxyBot', async () => {
    let mockListBots;
    beforeEach(async () => {
      mockListBots = [faker.name.firstName(), faker.name.firstName()];
      sinon.stub(constants, 'WAIVIO_PROXY_BOTS').value(mockListBots);
    });
    afterEach(() => {
      sinon.restore();
    });
    it('should return true if user in list proxy bots', () => {
      expect(validateProxyBot(mockListBots[0])).to.be.true;
    });
    it('should return false if user not in list proxy bots', () => {
      expect(validateProxyBot(faker.name.firstName())).to.be.false;
    });
    it('should return false if called without params', () => {
      expect(validateProxyBot()).to.be.false;
    });
  });

  describe('on getFromMetadataGuestInfo', () => {
    let mockListBots;
    beforeEach(async () => {
      mockListBots = [faker.name.firstName(), faker.name.firstName()];
      sinon.stub(constants, 'WAIVIO_PROXY_BOTS').value(mockListBots);
    });
    afterEach(() => {
      sinon.restore();
    });

    it('should return all items from "comment"', () => {
      const data = {
        operation: { author: mockListBots[0] },
        metadata: { comment: { userId: faker.random.string(), social: faker.random.string() } },
      };
      expect(getFromMetadataGuestInfo(data)).to.be.deep.eq(data.metadata.comment);
    });
    it('should return undefined if operation author isn\'t proxy bot', () => {
      const data = {
        operation: { author: faker.name.firstName() },
        metadata: { comment: { userId: faker.random.string(), displayName: faker.name.firstName(), social: faker.random.string() } },
      };
      expect(getFromMetadataGuestInfo(data)).to.be.undefined;
    });
    it('should return undefined if social isn\'t string', () => {
      const data = {
        operation: { author: mockListBots[0] },
        metadata: { comment: { userId: faker.random.string(), displayName: faker.name.firstName(), social: faker.random.number() } },
      };
      expect(getFromMetadataGuestInfo(data)).to.be.undefined;
    });
    it('should return undefined if social missing', () => {
      const data = {
        operation: { author: mockListBots[0] },
        metadata: { comment: { userId: faker.random.string(), displayName: faker.name.firstName() } },
      };
      expect(getFromMetadataGuestInfo(data)).to.be.undefined;
    });
    it('should not return undefined if displayName missing', () => {
      const data = {
        operation: { author: mockListBots[0] },
        metadata: { comment: { userId: faker.random.string(), social: faker.random.string() } },
      };
      expect(getFromMetadataGuestInfo(data)).to.not.be.undefined;
    });
    it('should return undefined if userId isn\'t string', () => {
      const data = {
        operation: { author: mockListBots[0] },
        metadata: { comment: { userId: faker.random.number(), displayName: faker.random.string(), social: faker.random.string() } },
      };
      expect(getFromMetadataGuestInfo(data)).to.be.undefined;
    });
    it('should return undefined if userId missing', () => {
      const data = {
        operation: { author: mockListBots[0] },
        metadata: { comment: { displayName: faker.random.string(), social: faker.random.string() } },
      };
      expect(getFromMetadataGuestInfo(data)).to.be.undefined;
    });
  });
});
