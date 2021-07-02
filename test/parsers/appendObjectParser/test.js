const {
  appendObjectParser, WObject, expect, redisGetter, AppModel,
  updateSpecificFieldsHelper, sinon, usersUtil, importUser, faker,
} = require('test/testHelper');
const { getMocksData } = require('./mocks');

describe('Append object parser', async () => {
  let mockData, wobject, updateSpecificFieldsHelperStub, blackList;

  beforeEach(async () => {
    blackList = [faker.random.string(), faker.random.string()];
    sinon.stub(AppModel, 'getOne').returns(Promise.resolve({ app: { black_list_users: blackList } }));
    sinon.stub(usersUtil, 'getUser').returns({ user: 'its ok' });
    sinon.stub(importUser, 'send').returns({ response: 'its ok' });
    updateSpecificFieldsHelperStub = sinon.stub(updateSpecificFieldsHelper, 'update').callsFake(() => {});
    mockData = await getMocksData();
    await appendObjectParser.parse(mockData.operation, mockData.metadata);
    wobject = await WObject.findOne({ author_permlink: mockData.wobject.author_permlink }).lean();
  });
  afterEach(() => {
    sinon.restore();
  });

  it('should call "updateSpecifiedFields" once', () => {
    expect(updateSpecificFieldsHelperStub.calledOnce).to.be.true;
  });

  it('should call "updateSpecifiedFieldHelper" with correct params', () => {
    expect(...updateSpecificFieldsHelperStub.args[0]).to.be.deep.eq({
      author: mockData.operation.author,
      permlink: mockData.operation.permlink,
      authorPermlink: mockData.operation.parent_permlink,
      metadata: mockData.metadata,
    });
  });

  describe('field', async () => {
    it('should exist', async () => {
      const field = wobject.fields.find((f) => f.author === mockData.operation.author && f.permlink === mockData.operation.permlink);

      expect(field).to.exist;
    });
    it('should have weight 1', async () => {
      const field = wobject.fields.find((f) => f.author === mockData.operation.author && f.permlink === mockData.operation.permlink);

      expect(field.weight).to.equal(1);
    });
    it('should have keys name,body,weight,locale,author,creator,permlink', async () => {
      const field = wobject.fields.find((f) => f.author === mockData.operation.author && f.permlink === mockData.operation.permlink);

      expect(field).to.include.all.keys('name', 'body', 'weight', 'locale', 'author', 'creator', 'permlink');
    });
  });
  describe('redis', async () => {
    let redisResponse;

    beforeEach(async () => {
      redisResponse = await redisGetter.getHashAll(`${mockData.operation.author}_${mockData.operation.permlink}`);
    });
    it('should include ref on comment with create object', async () => {
      expect(redisResponse).to.exist;
    });
    it('should have keys type,root_wobj', async () => {
      expect(redisResponse).to.include.all.keys('type', 'root_wobj');
    });
    it('should have type:"append_wobj"', async () => {
      expect(redisResponse.type).to.equal('append_wobj');
    });
    it('should have correct "root_wobj" reference', async () => {
      expect(redisResponse.root_wobj).to.equal(wobject.author_permlink);
    });
  });
});
