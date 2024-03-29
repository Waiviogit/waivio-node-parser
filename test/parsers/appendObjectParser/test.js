const _ = require('lodash');
const {
  appendObjectParser, WObject, expect, redisGetter, AppModel,
  updateSpecificFieldsHelper, sinon, usersUtil, importUser, faker,
} = require('test/testHelper');
const { SEARCH_FIELDS, FIELDS_NAMES } = require('constants/wobjectsData');
const { ObjectFactory } = require('test/factories');
const { getMocksData } = require('./mocks');
const { createEdgeNGrams } = require('../../../utilities/helpers/updateSpecificFieldsHelper');

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
    const expectedParams = {
      author: mockData.operation.author,
      permlink: mockData.operation.permlink,
      authorPermlink: mockData.operation.parent_permlink,
      metadata: mockData.metadata,
    };
    expect(...updateSpecificFieldsHelperStub.args[0]).to.be.deep.eq(expectedParams);
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

  describe('addSearchField', async () => {
    let authorPermlink;
    beforeEach(async () => {
      authorPermlink = faker.random.string(10);
      await ObjectFactory.Create({ author_permlink: authorPermlink });
    });
    it('should return true if the addition was successful', async () => {
      const { result } = await updateSpecificFieldsHelper.addSearchField({
        authorPermlink,
        newWords: [faker.random.string(10)],
      });
      expect(result).to.be.true;
    });
    it('should return false if newWord not exist', async () => {
      const { result } = await updateSpecificFieldsHelper.addSearchField({
        authorPermlink,
      });
      expect(result).to.be.false;
    });
  });

  describe('parseSearchData', async () => {
    let searchFields, fieldValue;
    it('should return undefined if the field name not include in search fields', async () => {
      const field = {
        name: _.chain(FIELDS_NAMES).omit(SEARCH_FIELDS).sample(),
        body: faker.name.firstName().toLowerCase(),
      };
      searchFields = await updateSpecificFieldsHelper.parseSearchData(field);
      expect(searchFields).to.be.undefined;
    });
    it('should return name/email as a search word', async () => {
      fieldValue = faker.name.firstName().toLowerCase();
      const field = {
        name: _.sample([FIELDS_NAMES.NAME, FIELDS_NAMES.EMAIL]),
        body: fieldValue,
      };
      searchFields = await updateSpecificFieldsHelper.parseSearchData(field);
      expect(createEdgeNGrams(fieldValue, field.name)).to.be.equal(...searchFields);
    });
    it('should return phone as a search word', async () => {
      fieldValue = faker.name.firstName().toLowerCase();
      const field = {
        name: FIELDS_NAMES.PHONE, number: fieldValue,
      };
      searchFields = await updateSpecificFieldsHelper.parseSearchData(field);
      expect(createEdgeNGrams(fieldValue, field.name)).to.be.equal(...searchFields);
    });
    it('should return address as a search word', async () => {
      const rawAddress = '{"address":"Kyiv","street":"Strees","city":"Kyiv","state":"State","postalCode":"01111","country":"Ukraine"}';
      const expectedAddress = [
        'Kyi Kyiv',
        'Str Stre Stree Strees',
        'Kyi Kyiv',
        'Sta Stat State',
        '011 0111 01111',
        'Ukr Ukra Ukrai Ukrain Ukraine',
      ];
      const field = {
        name: FIELDS_NAMES.ADDRESS, body: rawAddress,
      };
      searchFields = await updateSpecificFieldsHelper.parseSearchData(field);
      expect(expectedAddress).to.be.deep.eq(searchFields);
    });
  });
});
