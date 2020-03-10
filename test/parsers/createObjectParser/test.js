const {
  createObjectParser, WObject, expect, redisGetter,
  User, UserWobjects, wobjectHelper, sinon, userHelper, AppModel, faker,
} = require('test/testHelper');
const { getMocksData } = require('./mocks');

describe('Object parser', async () => {
  describe('when parse valid data', async () => {
    let mockData, wobject, blackList;

    beforeEach(async () => {
      blackList = [faker.random.string(), faker.random.string()];
      sinon.stub(AppModel, 'getOne').returns(Promise.resolve({ app: { black_list_users: blackList } }));
      sinon.stub(userHelper, 'checkAndCreateUser').returns({ user: 'its ok' });
      mockData = await getMocksData();
      sinon.spy(wobjectHelper, 'addSupposedUpdates');
      await createObjectParser.parse(mockData.operation, mockData.metadata);
      wobject = await WObject.findOne({ author_permlink: mockData.operation.permlink }).lean();
    });
    afterEach(async () => sinon.restore());

    describe('wobject', async () => {
      it('should creating in database', async () => {
        expect(wobject).to.exist;
      });
      it('should have object_type as in parent post with CreateObjectType', async () => {
        expect(wobject.object_type).to.equal(mockData.objectType.name);
      });
    });
    describe('redis result', async () => {
      let redisResult;

      beforeEach(async () => {
        redisResult = await redisGetter.getHashAll(`${wobject.author}_${wobject.author_permlink}`);
      });
      it('should exist', async () => {
        expect(redisResult).to.exist;
      });
      it('should have keys root_wobj and type', async () => {
        expect(redisResult).to.have.all.keys('root_wobj', 'type');
      });
      it('should have type: "create_wobj"', async () => {
        expect(redisResult.type).to.be.equal('create_wobj');
      });
      it('should have correct "root_wobj"', async () => {
        expect(redisResult.root_wobj).to.be.equal(wobject.author_permlink);
      });
    });
    describe('creator(user)', async () => {
      let creator;

      beforeEach(async () => {
        creator = await User.findOne({ name: mockData.metadata.wobj.creator });
      });
      it('shouldn\t  exist', async () => {
        expect(creator).to.not.exist;
      });
    });
    describe('wobjectHelper addSupposedUpdates', async () => {
      it('should be called once', () => {
        expect(wobjectHelper.addSupposedUpdates).to.be.calledOnce;
      });
      it('should be called with correct params', () => {
        wobject.id = wobject._id.toString();
        const call1 = wobjectHelper.addSupposedUpdates.getCall(0);
        expect(call1.args[0]).to.be.deep.eq(wobject);
      });
    });
  });
});
