const _ = require('lodash');
const {
  expect, sinon, importUpdates, tagsParser, faker, AppModel,
} = require('test/testHelper');
const { ObjectFactory, ObjectTypeFactory } = require('test/factories');

const mocks = require('./mocks');

describe('On createTags', async () => {
  let object, id, objectTypeName;
  beforeEach(async () => {
    objectTypeName = 'dish';
    id = faker.random.string();
    await ObjectTypeFactory.Create(
      { name: objectTypeName, supposed_updates: [{ name: 'tagCategory', values: mocks.mockDish }] },
    );
    object = await ObjectFactory.Create(
      {
        object_type: objectTypeName,
        appends: [
          { name: 'tagCategory', body: mocks.mockDish[0], id },
          { name: 'name', body: faker.random.string(), id },
        ],
      },
    );
    sinon.stub(AppModel, 'findOne').returns(Promise.resolve({ result: { tagsData: mocks.tagsData } }));
    sinon.stub(importUpdates, 'send').returns(Promise.resolve('Ok'));
  });
  afterEach(async () => {
    sinon.restore();
  });
  describe('On Success', async () => {
    let field, tag, importData;
    beforeEach(async () => {
      tag = mocks.tagsData.Ingredients.cheese;
      field = {
        body: `${faker.random.string(20)} ${tag}`,
      };

      await tagsParser.createTags({ authorPermlink: object.author_permlink, field });
      [[[importData]]] = importUpdates.send.args;
    });
    it('should successfully create tags with valid data', async () => {
      expect(importUpdates.send).to.be.calledOnce;
    });
    it('should add tagCategories if they not exist', async () => {
      const categories = _.filter(importData.fields, (obj) => obj.name === 'tagCategory');
      expect(categories).to.have.length(1);
    });
    it('should not create category if it exist at object', async () => {
      const category = _.find(importData.fields, (obj) => obj.body === mocks.mockDish[0]);
      expect(category).to.be.undefined;
    });
    it('should correctly create right tag from field', async () => {
      const category = _.find(importData.fields, (obj) => obj.body === tag);
      expect(category).is.exist;
    });
    it('should pick correct id from exist tagCategory field', async () => {
      const category = _.find(importData.fields, (obj) => obj.body === tag);
      expect(category.id).to.be.eq(id);
    });
    it('should create data for correct object', async () => {
      expect(importData.author_permlink).to.be.eq(object.author_permlink);
    });
    it('should create data for correct object type', async () => {
      expect(importData.object_type).to.be.eq(object.object_type);
    });
  });
});
