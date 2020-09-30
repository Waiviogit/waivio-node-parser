const {
  expect, faker, sinon, AppModel,
} = require('test/testHelper');
const { createObjectValidator } = require('validator');
const { ObjectTypeFactory, ObjectFactory } = require('test/factories');

describe('createObjectValidator', async () => {
  let objectType, mockData, mockOp, blackList;

  beforeEach(async () => {
    blackList = [faker.random.string(), faker.random.string()];
    sinon.stub(AppModel, 'findOne').returns(Promise.resolve({ result: { black_list_users: blackList } }));
    // generate valid data before all tests
    objectType = await ObjectTypeFactory.Create();
    mockOp = {
      author: faker.name.firstName().toLowerCase(),
      permlink: faker.random.string(15),
      parent_author: objectType.author,
      parent_permlink: objectType.permlink,
    };
    mockData = {
      author_permlink: mockOp.permlink,
      author: mockOp.author,
      creator: faker.name.firstName().toLowerCase(),
      default_name: faker.random.string(10),
    };
  });
  afterEach(async () => {
    sinon.restore();
  });
  describe('on valid input', async () => {
    it('should should not throw any error', async () => {
      await expect(createObjectValidator.validate(mockData, mockOp)).to.not.be.rejected;
    });
  });

  describe('on invalid input', async () => {
    describe('when data do not contain all keys', async () => {
      const requiredKeys = 'author_permlink,author,creator,default_name'.split(',');

      for (const key of requiredKeys) {
        it(`should be rejected without ${key}`, async () => {
          delete mockData[key];
          await expect(createObjectValidator.validate(mockData, mockOp)).to.be.rejected;
        });
      }
      for (const key of requiredKeys) {
        it(`should be rejected without ${key} with correct message`, async () => {
          delete mockData[key];
          await expect(createObjectValidator.validate(mockData, mockOp))
            .to.be.rejectedWith(Error, "Can't create object, not all required fields is filling!");
        });
      }
    });

    describe('when parent post is not Create Object Type post', async () => {
      it('should be rejected if parent author wrong', async () => {
        mockOp.parent_author = faker.name.firstName().toLowerCase();
        await expect(createObjectValidator.validate(mockData, mockOp)).to.rejected;
      });
      it('should be rejected if parent_author wrong with corr. message', async () => {
        mockOp.parent_author = faker.name.firstName().toLowerCase();
        await expect(createObjectValidator.validate(mockData, mockOp))
          .to.be.rejectedWith(Error, "Can't create object, parent post isn't create Object Type post or wrong object type!");
      });
      it('should be rejected if parent_permlink wrong', async () => {
        mockOp.parent_permlink = faker.random.string(10);
        await expect(createObjectValidator.validate(mockData, mockOp)).to.be.rejected;
      });
      it('should be rejected if parent_permlink wrong with corr. message', async () => {
        mockOp.parent_author = faker.random.string(10);
        await expect(createObjectValidator.validate(mockData, mockOp))
          .to.be.rejectedWith(Error, "Can't create object, parent post isn't create Object Type post or wrong object type!");
      });
      it('should be reject if it appendObject comment', async () => {
        const wobj = await ObjectFactory.Create();
        mockOp.parent_author = wobj.author;
        mockOp.parent_permlink = wobj.author_permlink;
        await expect(createObjectValidator.validate(mockData, mockOp)).to.be.rejected;
      });
    });

    describe('when user on blacklist', async () => {
      it('should be rejected if author of operation in blacklist', async () => {
        mockOp.author = blackList[0];
        mockData.author = mockOp.author;
        await expect(createObjectValidator.validate(mockData, mockOp)).to.be.rejected;
      });
      it('should be rejected with correct message if author of operation in blacklist', async () => {
        mockOp.author = blackList[0];
        mockData.author = mockOp.author;
        await expect(createObjectValidator.validate(mockData, mockOp))
          .to.be.rejectedWith(Error, "Can't create object, user in blacklist!");
      });
      it('should be rejected if creator of wobject in blacklist', async () => {
        mockData.creator = blackList[0];
        await expect(createObjectValidator.validate(mockData, mockOp)).to.be.rejected;
      });
    });
  });
});
