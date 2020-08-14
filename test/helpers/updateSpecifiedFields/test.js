const _ = require('lodash');
const {
  expect, updateSpecificFieldsHelper, WObject, faker, dropDatabase, ObjectID,
} = require('test/testHelper');
const { AppendObject, ObjectFactory, AppFactory } = require('test/factories');

describe('UpdateSpecificFieldsHelper', async () => {
  let wobject;

  beforeEach(async () => {
    await dropDatabase();
    wobject = await ObjectFactory.Create();
  });
  describe('on "parent" field', () => {
    let fields, updWobj;
    const adminName = faker.name.firstName();

    beforeEach(async () => {
      await AppFactory.Create({ name: 'waiviotest', admins: [adminName] });
    });
    describe('when is there no admins likes and there is no fields with positive weight', async () => {
      beforeEach(async () => {
        const { appendObject: field1 } = await AppendObject.Create({ name: 'parent', weight: _.random(-100, -1) });
        const { appendObject: field2 } = await AppendObject.Create({ name: 'parent', weight: _.random(-100, -1) });

        fields = [field1, field2];
        await WObject.findOneAndUpdate({ author_permlink: wobject.author_permlink }, { fields });
        await updateSpecificFieldsHelper.update(
          field1.author, field1.permlink, wobject.author_permlink,
        );
        updWobj = await WObject.findOne({ author_permlink: wobject.author_permlink }).lean();
      });

      it('should leave parent field empty', async () => {
        expect(updWobj.parent).to.be.empty;
      });
    });
    describe('when is there no admins likes and one or more fields has positive weight', async () => {
      beforeEach(async () => {
        const { appendObject: field1 } = await AppendObject.Create({ name: 'parent', weight: _.random(1, 100) });
        const { appendObject: field2 } = await AppendObject.Create({ name: 'parent', weight: _.random(101, 10000) });

        fields = [field1, field2];
        await WObject.findOneAndUpdate({ author_permlink: wobject.author_permlink }, { fields });
        await updateSpecificFieldsHelper.update(
          field1.author, field1.permlink, wobject.author_permlink,
        );
        updWobj = await WObject.findOne({ author_permlink: wobject.author_permlink }).lean();
      });

      it('should write second field "parent"', async () => {
        expect(updWobj.parent).to.be.eq(fields[1].body);
      });
    });
    describe('when has admin like his field always win', async () => {
      beforeEach(async () => {
        const activeVotes = [{
          _id: new ObjectID(),
          voter: adminName,
          percent: 100,
        }];
        const { appendObject: field1 } = await AppendObject.Create({ name: 'parent', weight: _.random(-100, -10), activeVotes });
        const { appendObject: field2 } = await AppendObject.Create({ name: 'parent', weight: _.random(100, 1000) });

        fields = [field1, field2];
        await WObject.findOneAndUpdate({ author_permlink: wobject.author_permlink }, { fields });
        await updateSpecificFieldsHelper.update(
          field1.author, field1.permlink, wobject.author_permlink,
        );
        updWobj = await WObject.findOne({ author_permlink: wobject.author_permlink }).lean();
      });
      it('should write admin field', async () => {
        expect(updWobj.parent).to.be.eq(fields[0].body);
      });
    });
    describe('if admin dislike field even if it has big weight it will loose', async () => {
      beforeEach(async () => {
        const activeVotes = [{
          _id: new ObjectID(),
          voter: adminName,
          percent: -100,
        }];
        const { appendObject: field1 } = await AppendObject.Create({ name: 'parent', weight: _.random(101, 1000), activeVotes });
        const { appendObject: field2 } = await AppendObject.Create({ name: 'parent', weight: _.random(50, 100) });
        const { appendObject: field3 } = await AppendObject.Create({ name: 'parent', weight: _.random(1, 40) });

        fields = [field1, field2, field3];
        await WObject.findOneAndUpdate({ author_permlink: wobject.author_permlink }, { fields });
        await updateSpecificFieldsHelper.update(
          field1.author, field1.permlink, wobject.author_permlink,
        );
        updWobj = await WObject.findOne({ author_permlink: wobject.author_permlink }).lean();
      });
      it('should write field with no dislike with bigger weight', async () => {
        expect(updWobj.parent).to.be.eq(fields[1].body);
      });
    });
    describe('if admin dislike field and other fields has weight < 0 parent will be empty string', async () => {
      beforeEach(async () => {
        const activeVotes = [{
          _id: new ObjectID(),
          voter: adminName,
          percent: -100,
        }];
        const { appendObject: field1 } = await AppendObject.Create({ name: 'parent', weight: _.random(100, 1000), activeVotes });
        const { appendObject: field2 } = await AppendObject.Create({ name: 'parent', weight: _.random(-100, -10) });

        fields = [field1, field2];
        await WObject.findOneAndUpdate({ author_permlink: wobject.author_permlink }, { fields });
        await updateSpecificFieldsHelper.update(
          field1.author, field1.permlink, wobject.author_permlink,
        );
        updWobj = await WObject.findOne({ author_permlink: wobject.author_permlink }).lean();
      });
      it('should be empty string', async () => {
        expect(updWobj.parent).to.be.empty;
      });
    });
  });

  describe('on "newsFilter" field', () => {
    let fields;
    let updWobj;
    let mockBody;

    beforeEach(async () => {
      mockBody = () => JSON.stringify({
        allowList: [['a', 'b'], ['c', 'd']],
        ignoreList: ['e', 'f', faker.random.string(3)],
      });
      const { appendObject: field1 } = await AppendObject.Create({ name: 'newsFilter', body: (mockBody()), weight: 100 });
      const { appendObject: field2 } = await AppendObject.Create({ name: 'newsFilter', body: (mockBody()), weight: 1 });
      const { appendObject: field3 } = await AppendObject.Create({ name: 'newsFilter', body: (mockBody()), weight: -99 });
      const { appendObject: field4 } = await AppendObject.Create({ name: 'newsFilter', body: (mockBody()), weight: 80 });

      fields = [field1, field2, field3, field4];
      await WObject.findOneAndUpdate({ author_permlink: wobject.author_permlink }, { fields });
      await updateSpecificFieldsHelper.update(
        field1.author, field1.permlink, wobject.author_permlink,
      );
      updWobj = await WObject.findOne({ author_permlink: wobject.author_permlink }).lean();
    });

    it('should add field "newsFilter" to wobject', async () => {
      expect(updWobj.newsFilter).to.exist;
    });

    it('should write first field "newsFilter"', async () => {
      expect(updWobj.newsFilter).to.deep.equal(JSON.parse(fields[0].body));
    });
  });

  describe('on "tagCloud" field', () => {
    let fields;
    let updWobj;
    let topFields;

    beforeEach(async () => {
      const { appendObject: field1 } = await AppendObject.Create({ name: 'tagCloud', weight: 100 });
      const { appendObject: field2 } = await AppendObject.Create({ name: 'tagCloud', weight: 1 });
      const { appendObject: field3 } = await AppendObject.Create({ name: 'tagCloud', weight: -99 });
      const { appendObject: field4 } = await AppendObject.Create({ name: 'tagCloud', weight: 80 });
      const { appendObject: field5 } = await AppendObject.Create({ name: 'tagCloud', weight: 50 });
      const { appendObject: field6 } = await AppendObject.Create({ name: 'tagCloud', weight: 11 });
      const { appendObject: field7 } = await AppendObject.Create({ name: 'tagCloud', weight: -120 });

      fields = [field1, field2, field3, field4, field5, field6, field7];
      topFields = [field1, field2, field4, field5, field6];
      await WObject.findOneAndUpdate({ author_permlink: wobject.author_permlink }, { fields });
      await updateSpecificFieldsHelper.update(
        field1.author, field1.permlink, wobject.author_permlink,
      );
      updWobj = await WObject.findOne({ author_permlink: wobject.author_permlink }).lean();
    });

    it('should write first field "tagCloud"', async () => {
      expect(updWobj.tagClouds.map((item) => {
        _.pick(item, ['author', 'permlink']);
      })).to.deep.eq(topFields.map((item) => {
        _.pick(item, ['author', 'permlink']);
      }));
    });
  });

  describe('on "rating" field', () => {
    let fields;
    let updWobj;
    let topFields;

    beforeEach(async () => {
      const { appendObject: field1 } = await AppendObject.Create({ name: 'rating', weight: 100 });
      const { appendObject: field2 } = await AppendObject.Create({ name: 'rating', weight: 1 });
      const { appendObject: field3 } = await AppendObject.Create({ name: 'rating', weight: -99 });
      const { appendObject: field4 } = await AppendObject.Create({ name: 'rating', weight: 80 });
      const { appendObject: field5 } = await AppendObject.Create({ name: 'rating', weight: 50 });
      const { appendObject: field6 } = await AppendObject.Create({ name: 'rating', weight: 11 });
      const { appendObject: field7 } = await AppendObject.Create({ name: 'rating', weight: -120 });

      fields = [field1, field2, field3, field4, field5, field6, field7];
      topFields = [field1, field4, field5, field6];
      await WObject.findOneAndUpdate({ author_permlink: wobject.author_permlink }, { fields });
      await updateSpecificFieldsHelper.update(
        field1.author, field1.permlink, wobject.author_permlink,
      );
      updWobj = await WObject.findOne({ author_permlink: wobject.author_permlink }).lean();
    });

    it('should add field "rating" to wobject', async () => {
      expect(updWobj.ratings).to.exist;
    });

    it('should write first field "rating"', async () => {
      expect(updWobj.ratings.map((item) => {
        _.pick(item, ['author', 'permlink']);
      })).to.deep.eq(topFields.map((item) => {
        _.pick(item, ['author', 'permlink']);
      }));
    });
  });

  describe('on "map" field', () => {
    let fields;
    let updWobj;

    beforeEach(async () => {
      const mockBody = () => JSON.stringify({
        longitude: faker.random.number({ min: -180, max: 180 }),
        latitude: faker.random.number({ min: -90, max: 90 }),
      });
      const { appendObject: field1 } = await AppendObject.Create({ name: 'map', body: (mockBody()), weight: 10 });
      const { appendObject: field2 } = await AppendObject.Create({ name: 'map', body: (mockBody()), weight: 1 });
      const { appendObject: field3 } = await AppendObject.Create({ name: 'map', body: (mockBody()), weight: -99 });
      const { appendObject: field4 } = await AppendObject.Create({ name: 'map', body: (mockBody()), weight: 80 });

      fields = [field1, field2, field3, field4];
      await WObject.findOneAndUpdate({ author_permlink: wobject.author_permlink }, { fields });
      await updateSpecificFieldsHelper.update(
        field1.author, field1.permlink, wobject.author_permlink,
      );
      updWobj = await WObject.findOne({ author_permlink: wobject.author_permlink }).lean();
    });

    it('should add field "map" to wobject', async () => {
      expect(updWobj.map).to.exist;
    });

    it('should write top field "map" to root of wobject', async () => {
      const mockBody = JSON.parse(fields[3].body);

      expect(updWobj.map).to.deep.equal({ type: 'Point', coordinates: [mockBody.longitude, mockBody.latitude] });
    });
  });

  describe('on "status" field', () => {
    let updWobj;

    beforeEach(async () => {
      const mockBody = () => JSON.stringify({ title: 'Unavailable', link: '' });
      const { appendObject: field1 } = await AppendObject.Create({
        root_wobj: wobject.author_permlink, name: 'status', body: (mockBody()), weight: 10,
      });
      await AppendObject.Create({
        root_wobj: wobject.author_permlink, name: 'status', body: (mockBody()), weight: 1,
      });
      await AppendObject.Create({
        root_wobj: wobject.author_permlink, name: 'status', body: (mockBody()), weight: -99,
      });
      await AppendObject.Create({
        root_wobj: wobject.author_permlink, name: 'status', body: (mockBody()), weight: 80,
      });

      await updateSpecificFieldsHelper.update(field1.author, field1.permlink, wobject.author_permlink);
      updWobj = await WObject.findOne({ author_permlink: wobject.author_permlink }).lean();
    });

    it('should add field "status" to wobject', async () => {
      expect(updWobj.status).to.exist;
    });

    it('should write top field "status" to root of wobject', async () => {
      expect(updWobj.status).to.deep.equal({ title: 'Unavailable', link: '' });
    });
  });

  describe('on "tagCategory" field', async () => {
    let updWobj;
    beforeEach(async () => {
      const [id1, id2] = [faker.random.string(10), faker.random.string(10)];
      const tagWobjects = [
        await ObjectFactory.Create({ object_type: 'hashtag' }),
        await ObjectFactory.Create({ object_type: 'hashtag' }),
        await ObjectFactory.Create({ object_type: 'hashtag' }),
      ];

      const { appendObject: category1 } = await AppendObject.Create({
        root_wobj: wobject.author_permlink, name: 'tagCategory', body: faker.random.string(), additionalFields: { id: id1 },
      });
      await AppendObject.Create({
        root_wobj: wobject.author_permlink, name: 'categoryItem', body: tagWobjects[0].author_permlink, additionalFields: { id: id1 },
      });
      await AppendObject.Create({
        root_wobj: wobject.author_permlink, name: 'categoryItem', body: tagWobjects[1].author_permlink, additionalFields: { id: id1 },
      });
      await AppendObject.Create({
        root_wobj: wobject.author_permlink, name: 'tagCategory', body: faker.random.string(), additionalFields: { id: id2 },
      });
      await AppendObject.Create({
        root_wobj: wobject.author_permlink, name: 'categoryItem', body: tagWobjects[2].author_permlink, additionalFields: { id: id2 },
      });
      await AppendObject.Create({
        root_wobj: wobject.author_permlink, name: 'tagCategory', body: faker.random.string(), additionalFields: { id: faker.random.string() },
      });

      await updateSpecificFieldsHelper.update(category1.author, category1.permlink, wobject.author_permlink);
      updWobj = await WObject.findOne({ author_permlink: wobject.author_permlink }).lean();
    });
    it('should create field "tagCategories" on wobject root', async () => {
      expect(updWobj.tagCategories).to.exist;
    });
    it('should create field "tagCategories" on wobject root with correct length', async () => {
      expect(updWobj.tagCategories.length).to.be.eq(3);
    });
  });

  describe('on "categoryItem" field', async () => {
    let updWobj;
    beforeEach(async () => {
      const [id1, id2] = [faker.random.string(10), faker.random.string(10)];
      const tagWobjects = [
        await ObjectFactory.Create({ object_type: 'hashtag' }),
        await ObjectFactory.Create({ object_type: 'hashtag' }),
        await ObjectFactory.Create({ object_type: 'hashtag' }),
      ];

      await AppendObject.Create({
        root_wobj: wobject.author_permlink, name: 'tagCategory', body: faker.random.string(), additionalFields: { id: id1 },
      });
      const { appendObject: categoryItem1 } = await AppendObject.Create({
        root_wobj: wobject.author_permlink, name: 'categoryItem', body: tagWobjects[0].author_permlink, additionalFields: { id: id1 },
      });
      await AppendObject.Create({
        root_wobj: wobject.author_permlink, name: 'categoryItem', body: tagWobjects[1].author_permlink, additionalFields: { id: id1 },
      });
      await AppendObject.Create({
        root_wobj: wobject.author_permlink, name: 'tagCategory', body: faker.random.string(), additionalFields: { id: id2 },
      });
      await AppendObject.Create({
        root_wobj: wobject.author_permlink, name: 'categoryItem', body: tagWobjects[2].author_permlink, additionalFields: { id: id2 },
      });
      await AppendObject.Create({
        root_wobj: wobject.author_permlink, name: 'tagCategory', body: faker.random.string(), additionalFields: { id: faker.random.string() },
      });

      await updateSpecificFieldsHelper.update(categoryItem1.author, categoryItem1.permlink, wobject.author_permlink);
      updWobj = await WObject.findOne({ author_permlink: wobject.author_permlink }).lean();
    });
    it('should create field "tagCategories" on wobject root', async () => {
      expect(updWobj.tagCategories).to.exist;
    });
    it('should create field "tagCategories" on wobject root with correct length', async () => {
      expect(updWobj.tagCategories.length).to.be.eq(3);
    });
  });
});
