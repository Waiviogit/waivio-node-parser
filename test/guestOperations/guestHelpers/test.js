const {
  expect, faker, sinon, appHelper,
} = require('test/testHelper');
const {  getFromMetadataGuestInfo } = require('utilities/guestOperations/guestHelpers');

describe('guestHelpers', async () => {
  describe('on getFromMetadataGuestInfo', () => {
    let mockListBots;
    beforeEach(async () => {
      mockListBots = [faker.name.firstName(), faker.name.firstName()];
      sinon.stub(appHelper, 'getProxyBots').returns(Promise.resolve(mockListBots));
    });
    afterEach(() => {
      sinon.restore();
    });

    it('should return all items from "comment"', async () => {
      const data = {
        operation: { author: mockListBots[0] },
        metadata: { comment: { userId: faker.random.string(), social: faker.random.string() } },
      };
      expect(await getFromMetadataGuestInfo(data)).to.be.deep.eq(data.metadata.comment);
    });
    it('should return undefined if operation author isn\'t proxy bot', async () => {
      const data = {
        operation: { author: faker.name.firstName() },
        metadata: {
          comment:
              {
                userId: faker.random.string(),
                displayName: faker.name.firstName(),
                social: faker.random.string(),
              },
        },
      };
      expect(await getFromMetadataGuestInfo(data)).to.be.undefined;
    });
    it('should return undefined if social isn\'t string', async () => {
      const data = {
        operation: { author: mockListBots[0] },
        metadata: {
          comment:
              {
                userId: faker.random.string(),
                displayName: faker.name.firstName(),
                social: faker.random.number(),
              },
        },
      };
      expect(await getFromMetadataGuestInfo(data)).to.be.undefined;
    });
    it('should return undefined if social missing', async () => {
      const data = {
        operation: { author: mockListBots[0] },
        metadata: {
          comment:
              {
                userId: faker.random.string(),
                displayName: faker.name.firstName(),
              },
        },
      };
      expect(await getFromMetadataGuestInfo(data)).to.be.undefined;
    });
    it('should not return undefined if displayName missing', async () => {
      const data = {
        operation: { author: mockListBots[0] },
        metadata: { comment: { userId: faker.random.string(), social: faker.random.string() } },
      };
      expect(await getFromMetadataGuestInfo(data)).to.not.be.undefined;
    });
    it('should return undefined if userId isn\'t string', async () => {
      const data = {
        operation: { author: mockListBots[0] },
        metadata: {
          comment: {
            userId: faker.random.number(),
            displayName: faker.random.string(),
            social: faker.random.string(),
          },
        },
      };
      expect(await getFromMetadataGuestInfo(data)).to.be.undefined;
    });
    it('should return undefined if userId missing', async () => {
      const data = {
        operation: { author: mockListBots[0] },
        metadata: {
          comment:
              {
                displayName: faker.random.string(),
                social: faker.random.string(),
              },
        },
      };
      expect(await getFromMetadataGuestInfo(data)).to.be.undefined;
    });
  });
});
