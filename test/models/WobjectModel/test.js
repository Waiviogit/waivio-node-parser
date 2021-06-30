const _ = require('lodash');
const { SEARCH_FIELDS } = require('constants/wobjectsData');
const { ObjectFactory, PostFactory, AppendObject } = require('test/factories');
const WObjectModel = require('database').models.WObject;
const {
  expect, WobjModel, WObject, faker, ObjectType, dropDatabase,
} = require('test/testHelper');

describe('Wobject model', async () => {
  describe('On addVote', async () => {
    let result,
      data,
      voter,
      wobject,
      appendObject;
    beforeEach(async () => {
      const resultCreateAppend = await AppendObject.Create();
      wobject = resultCreateAppend.wobject;
      appendObject = resultCreateAppend.appendObject;
      data = {
        author: appendObject.author,
        permlink: appendObject.permlink,
        author_permlink: wobject.author_permlink,
        weight: 1111,
        vote: {
          voter: faker.random.string(),
          weight: 100,
        },
      };
    });
    it('should return true with correct addVote data', async () => {
      result = await WobjModel.addVote(data);
      expect(result.result).is.true;
    });
    it('should return false on incorrect data', async () => {
      result = await WobjModel.addVote({
        author: faker.random.string(),
        permlink: faker.random.string(),
        author_permlink: faker.random.string(),
        weight: 1111,
        vote: {
          voter,
          weight: 100,
        },
      });
      expect(result.result).is.false;
    });
    it('should add vote to field', async () => {
      await WobjModel.addVote(data);
      result = await WObjectModel.findOne({ author_permlink: data.author_permlink });
      expect(result.fields[0].active_votes[0].voter).to.eq(data.vote.voter);
    });
    it('should return error without data', async () => {
      result = await WobjModel.addVote();
      expect(result.error).is.exist;
    });
    it('should return CastError message', async () => {
      result = await WobjModel.addVote({
        author: faker.random.string(),
        author_permlink: { data: faker.random.string() },
        permlink: faker.random.string(),
        weight: 1111,
      });
      expect(result.error.name).to.eq('CastError');
    });
  });
  describe('On getWobjectsRefs', async () => {
    let result,
      rnd;
    beforeEach(async () => {
      await dropDatabase();
      rnd = _.random(5, 10, false);
      for (let i = 0; i < rnd; i++) {
        await ObjectFactory.Create();
      }
    });
    it('should eq array length', async () => {
      result = await WobjModel.getWobjectsRefs();
      expect(result.wobjects.length).to.eq(rnd);
    });
    it('should eq arrays', async () => {
      result = await WobjModel.getWobjectsRefs();
      const findAll = await WObjectModel.find();
      const mappedDB = {
        wobjects: _.map(findAll, (obj) => ({
          author_permlink: obj.author_permlink,
          author: obj.author,
        })),
      };
      expect(result).to.deep.eq(mappedDB);
    });
  });
  describe('On getFieldsRefs', async () => {
    let result,
      wobjectsCount,
      wobject,
      data,
      permlink;
    beforeEach(async () => {
      permlink = faker.random.string();

      await dropDatabase();
      wobjectsCount = _.random(5, 10, false);
      await ObjectFactory.Create({ author_permlink: permlink });
      for (let i = 0; i < wobjectsCount; i++) {
        data = {
          author_permlink: permlink,
          field: {
            author: faker.random.string(),
            permlink: faker.random.string(),
          },
        };
        await WobjModel.addField(data);
      }
    });
    it('should fields eq', async () => {
      result = await WobjModel.getFieldsRefs(permlink);
      const temp = await WObjectModel.findOne({ author_permlink: data.author_permlink });
      wobject = _.map(temp.fields, (obj) => ({
        field_author: obj.author,
        field_permlink: obj.permlink,
      }));
      expect(result.fields).to.deep.eq(wobject);
    });
    it('should return empty array with incorrect permlink', async () => {
      result = await WobjModel.getFieldsRefs(faker.random.string());
      expect(result.fields.length === 0).is.true;
    });
    it('should return error with incorrect data', async () => {
      result = await WobjModel.getFieldsRefs();
      expect(result.error).is.not.exist;
    });
  });
  describe('On getSomeFields', async () => {
    let result;
    beforeEach(async () => {
      await dropDatabase();
      await AppendObject.Create();
      await AppendObject.Create();
    });
    it('should success compare array length', async () => {
      result = await WobjModel.getSomeFields();
      expect(result.wobjects.length).to.eq(2);
    });
    it('should dont get error with incorrect data', async () => {
      result = await WobjModel.getSomeFields({ some: { field: faker.random.string() } }, { field: { data: faker.random.string() } });
      expect(result.error).not.exist;
    });
  });
  describe('On getField', async () => {
    let result,
      field;
    beforeEach(async () => {
      await dropDatabase();
      result = await AppendObject.Create();
    });
    it('should get field of current wobject', async () => {
      field = await WobjModel.getField(result.appendObject.author, result.appendObject.permlink, result.root_wobj);
      expect(_.omit(field.field, ['_id'])).to.deep.eq(result.appendObject);
    });
    it('should return undefined without params', async () => {
      field = await WobjModel.getField();
      expect(field.field).is.undefined;
    });
    it('shouldn\'t return error with incorrect params', async () => {
      field = await WobjModel.getField({ test: faker.random.string() }, { get: faker.random.string() }, faker.random.string());
      expect(field.error).not.exist;
    });
  });
  describe('On updateField', async () => {
    let result,
      key,
      value,
      field,
      resultCreateAppend;
    key = 'weight';
    value = 550;
    beforeEach(async () => {
      await dropDatabase();
      resultCreateAppend = await AppendObject.Create();
      field = resultCreateAppend.appendObject;
    });
    it('should updateField return true', async () => {
      result = await WobjModel.updateField(field.author, field.permlink, resultCreateAppend.wobject.author_permlink, key, value);
      expect(result.result).is.true;
    });
    it('should return false with incorrect data', async () => {
      result = await WobjModel.updateField(field.author, field.permlink, faker.random.string(), key, value);
      expect(result.result).is.false;
    });
    it('should update field by correct value', async () => {
      await WobjModel.updateField(field.author, field.permlink, resultCreateAppend.wobject.author_permlink, key, value);
      result = await WObjectModel.findOne({ author_permlink: resultCreateAppend.wobject.author_permlink });
      expect(value).to.eq(result.fields[0].weight);
    });
    it('should return CastError with incorrect params type', async () => {
      result = await WobjModel.updateField({ author: { some: faker.random.string() } });
      expect(result.error.name).to.eq('CastError');
    });
  });
  describe('On pushNewPost', async () => {
    let author_permlink,
      result,
      post;
    beforeEach(async () => {
      await dropDatabase();
      post = await PostFactory.Create();
      author_permlink = faker.random.string();
      await ObjectFactory.Create({ author_permlink });
    });
    it('should pushNewPost return true', async () => {
      result = await WobjModel.pushNewPost({ author_permlink, post_id: post._id });
      expect(result.result).is.true;
    });
    it('should pushNewPost return false with nonexistent wobject', async () => {
      result = await WobjModel.pushNewPost({ author_permlink: faker.random.string(), post_id: post._id });
      expect(result.result).is.false;
    });
    it('should push needed post to wobject', async () => {
      await WobjModel.pushNewPost({ author_permlink, post_id: post._id });
      result = await WObjectModel.findOne({ author_permlink });
      expect(result.latest_posts[0]._id).to.deep.eq(post._id);
    });
    it('should increase last post count by 1', async () => {
      await WobjModel.pushNewPost({ author_permlink, post_id: post._id });
      result = await WObjectModel.findOne({ author_permlink });
      expect(result.last_posts_count).to.eq(1);
    });
    it('should return CastError', async () => {
      result = await WobjModel.pushNewPost({ author_permlink, post_id: post.id });
      expect(result.error.name).to.deep.eq('CastError');
    });
    it('should return error with incorrect data', async () => {
      result = await WobjModel.pushNewPost({ author_permlink: { data: faker.random.string() } });
      expect(result.error).is.exist;
    });
  });
  describe('On getOne', async () => {
    let result,
      permlink;
    beforeEach(async () => {
      permlink = faker.random.string();
      await ObjectFactory.Create({ author_permlink: permlink });
    });
    it('should return wobject on valid input', async () => {
      result = await WobjModel.getOne({ author_permlink: permlink });
      expect(result).is.exist;
    });
    it('should return correct wobject', async () => {
      result = await WobjModel.getOne({ author_permlink: permlink });
      expect(result.wobject.author_permlink).to.eq(permlink);
    });
    it('should return error with status 404 if wobj not found', async () => {
      result = await WobjModel.getOne({ author_permlink: faker.random.string(10) });

      expect(result.error.status).to.eq(404);
    });
    it('should return error message with incorrect input', async () => {
      result = await WobjModel.getOne({ author_permlink: faker.random.string(10) });

      expect(result.error.message).to.eq('Wobject not found!');
    });
    it('should return CastError', async () => {
      result = await WobjModel.getOne({ author_permlink: { permlink } });

      expect(result.error.name).to.eq('CastError');
    });
  });
  describe('On create', async () => {
    let result,
      data;
    beforeEach(async () => {
      data = await ObjectFactory.Create({ onlyData: true });
      await WobjModel.create(data);
    });
    it('should create wobject', async () => {
      result = await WObject.findOne({ author_permlink: data.author_permlink });

      expect(_.pick(result, ['author', 'author_permlink']))
        .to.deep.eq({ author: data.author, author_permlink: data.author_permlink });
    });
    it('should return error with not valid data', async () => {
      result = await WobjModel.create({ some: 'data' });

      expect(result.error.name).to.eq('ValidationError');
    });
  });
  describe('On update', async () => {
    let condition,
      updateData,
      wobject;
    beforeEach(async () => {
      await dropDatabase();
      wobject = await ObjectFactory.Create();
      condition = {
        author_permlink: wobject.author_permlink,
      };
      updateData = {
        $set: {
          count_posts: 1111,
        },
      };
    });
    it('should update field', async () => {
      await WobjModel.update(condition, updateData);
      const result = await WObject.findOne({ author_permlink: wobject.author_permlink });
      expect(result.count_posts).to.deep.eq(updateData.$set.count_posts);
    });
    it('should return error with incorrect input params', async () => {
      const result = await WobjModel.update('hello', 'world');

      expect(result.error).is.exist;
    });
    it('shouldn\'t update wobject with incorrect data ', async () => {
      await WobjModel.update('hello', 'world');
      const findPost = await WObject.findOne({ author_permlink: wobject.author_permlink });
      expect(findPost.count_posts).to.eq(0);
    });
  });
  describe('On addField', async () => {
    let result, data, permlink;
    beforeEach(async () => {
      permlink = faker.random.string();
      await ObjectFactory.Create({ author_permlink: permlink });
      data = {
        author_permlink: permlink,
        field: {
          data: faker.random.string(),
        },
      };
    });
    it('should return true on valid input', async () => {
      result = await WobjModel.addField(data);
      expect(result.result).is.true;
    });
    it('should return false with invalid input params', async () => {
      result = await WobjModel.addField({ author_permlink: faker.random.string() });

      expect(result.result).is.false;
    });
    it('should addField to wobject', async () => {
      await WobjModel.addField(data);
      result = await WObject.findOne({ author_permlink: permlink });

      expect(result._doc.fields[0]._doc.data).to.eq(data.field.data);
    });
    it('should return error without author permlink', async () => {
      result = await WobjModel.addField();

      expect(result.error.message).is.exist;
    });
    it('should return error with not valid field', async () => {
      result = await WobjModel.addField({ author_permlink: permlink, field: faker.random.string() });

      expect(result.error.name).to.eq('ObjectParameterError');
    });
  });
  describe('On increaseFieldWeight', async () => {
    let result,
      resultCreateAppend,
      field,
      weight;
    beforeEach(async () => {
      await dropDatabase();
      resultCreateAppend = await AppendObject.Create();
      field = resultCreateAppend.appendObject;
      weight = faker.random.number();
    });
    it('should return true with correct input', async () => {
      result = await WobjModel.increaseFieldWeight({
        author: field.author,
        permlink: field
          .permlink,
        author_permlink: resultCreateAppend.root_wobj,
        weight,
      });
      expect(result.result).is.true;
    });
    it('should increase by correct value', async () => {
      result = await WobjModel.increaseFieldWeight({
        author: field.author,
        permlink: field
          .permlink,
        author_permlink: resultCreateAppend.root_wobj,
        weight,
      });
      result = await WObject.findOne({ author_permlink: resultCreateAppend.root_wobj });

      expect(weight + field.weight).to.eq(result._doc.fields[0].weight);
    });
    it('should return error without input data', async () => {
      result = await WobjModel.increaseFieldWeight();
      expect(result.error).is.exist;
    });
    it('should return false if object don\'t found', async () => {
      result = await WobjModel.increaseFieldWeight({
        author: faker.random.string(),
        permlink: faker.random.string(),
        author_permlink: faker.random.string(),
        weight: 1111,
      });
      expect(result.result).is.false;
    });
    it('should return error without data', async () => {
      result = await WobjModel.increaseFieldWeight();
      expect(result.error).is.exist;
    });
    it('should return false without author permlink', async () => {
      result = await WobjModel.increaseFieldWeight({
        author: faker.random.string(),
        permlink: faker.random.string(),
        weight: 1111,
      });
      expect(result.result).is.false;
    });
    it('should return false without author', async () => {
      result = await WobjModel.increaseFieldWeight({
        author_permlink: faker.random.string(),
        permlink: faker.random.string(),
        weight: 1111,
      });
      expect(result.result).is.false;
    });
  });
  describe('On increaseWobjectWeight', async () => {
    let result,
      data,
      wobject;
    beforeEach(async () => {
      data = {
        author_permlink: faker.random.string(),
        weight: 100,
      };
      wobject = await ObjectFactory.Create({ author_permlink: data.author_permlink });
    });
    it('should return true with correct input', async () => {
      result = await WobjModel.increaseWobjectWeight(data);
      expect(result.result).is.true;
    });
    it('should increaseWobjectWeight by correct value', async () => {
      await WobjModel.increaseWobjectWeight(data);
      result = await WObject.findOne({ author_permlink: data.author_permlink });
      expect(result.weight).to.eq(data.weight);
    });
    it('should increase increaseWobjectWeight by correct value', async () => {
      await WobjModel.increaseWobjectWeight(data);
      result = await ObjectType.findOne({ name: wobject.object_type });
      expect(result.weight).to.eq(data.weight);
    });
    it('should return error without input data', async () => {
      result = await WobjModel.increaseWobjectWeight();
      expect(result.error.message).to.eq('Cannot read property \'author_permlink\' of undefined');
    });
    it('should return result false with incorrect data', async () => {
      result = await WobjModel.increaseWobjectWeight({
        author_permlink: faker.random.string(),
        weight: 100,
      });
      expect(result.result).is.false;
    });
  });
  describe('On removeVote', async () => {
    let result,
      data,
      field,
      voter,
      resultCreateAppend;
    beforeEach(async () => {
      await dropDatabase();
      resultCreateAppend = await AppendObject.Create();
      field = resultCreateAppend.appendObject;
      data = {
        author: field.author,
        permlink: field.permlink,
        author_permlink: resultCreateAppend.root_wobj,
        weight: 1111,
        voter: faker.random.string(),
      };
    });
    it('should return true with correct input value', async () => {
      result = await WobjModel.removeVote(data);
      expect(result.result).is.true;
    });
    it('should return false with incorrect input data', async () => {
      result = await WobjModel.removeVote({
        author: faker.random.string(),
        permlink: field.permlink,
        author_permlink: faker.random.string(),
        weight: 1111,
        voter,
      });
      expect(result.result).is.false;
    });
    it('should remove vote', async () => {
      await WobjModel.removeVote(data);
      result = await WObject.findOne({ author_permlink: data.author_permlink });

      expect(result.fields[0].active_votes).empty;
    });
    it('should return error without data', async () => {
      result = await WobjModel.removeVote();
      expect(result.error).is.exist;
    });
  });
  describe('On addSearchField', async () => {
    let authorPermlink, name;
    beforeEach(async () => {
      authorPermlink = faker.random.string();
      name = faker.random.string(10);
      await ObjectFactory.Create({
        author_permlink: authorPermlink,
        searchField: { name },
      });
    });
    it('should return true if the addition was successful', async () => {
      const { result } = await WobjModel.addSearchField({
        authorPermlink,
        fieldName: _.sample(SEARCH_FIELDS),
        newWord: faker.random.string(),
      });
      expect(result).to.be.true;
    });
    it('should return false if added fields were not specified', async () => {
      const { result } = await WobjModel.addSearchField({});
      expect(result).to.be.false;
    });
  });
});
