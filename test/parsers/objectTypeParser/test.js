const {
  objectTypeParser, ObjectType, expect, redisGetter, AppModel, faker, sinon
} = require('test/testHelper');
const { getMockData } = require('./mocks');

describe('Object Type parser', async () => {
  describe('with valid data', async () => {
    let mockData, blackList;

    beforeEach(async () => {
      blackList = [faker.random.string(), faker.random.string()];
      sinon.stub(AppModel, 'getOne').returns(Promise.resolve({ app: { black_list_users: blackList } }));
      mockData = getMockData();
      await objectTypeParser.parse(mockData.operation, mockData.metadata);
    });
    it('should create new ObjectType', async () => {
      const createdObjectType = await ObjectType.findOne(
        { name: mockData.metadata.wobj.name },
      ).lean();
      expect(createdObjectType).to.not.be.undefined;
    });
    afterEach(async () => {
      sinon.restore();
    });
    describe('redis', async () => {
      let redisResult;

      beforeEach(async () => {
        redisResult = await redisGetter.getHashAll(`${mockData.operation.author}_${mockData.operation.permlink}`);
      });
      it('should exist redis reference on post', async () => {
        expect(redisResult).to.exist;
      });
      it('should have keys type and name', async () => {
        expect(redisResult).to.include.all.keys('type', 'name');
      });
      it('should have type: "obj_type"', async () => {
        expect(redisResult.type).to.equal('wobj_type');
      });
      it('should have correct name', async () => {
        expect(redisResult.name).to.equal(mockData.metadata.wobj.name);
      });
    });
  });
  describe('with invalid', async () => {
    // ///////////////
  });
});
