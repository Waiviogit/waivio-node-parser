const _ = require('lodash');
const {
  FIELDS_NAMES, RATINGS_UPDATE_COUNT, OBJECT_TYPES, AUTHORITY_FIELD_ENUM,
} = require('constants/wobjectsData');
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
    let updWobj, fields = [];
    const adminName = faker.name.firstName();

    beforeEach(async () => {
      await AppFactory.Create({ name: 'waiviotest', admins: [adminName] });
    });
    describe('when is there no admins likes and there is no fields with positive weight', async () => {
      beforeEach(async () => {
        const { appendObject: field1 } = await AppendObject.Create(
          { name: FIELDS_NAMES.PARENT, weight: _.random(-100, -1) },
        );
        const { appendObject: field2 } = await AppendObject.Create(
          { name: FIELDS_NAMES.PARENT, weight: _.random(-100, -1) },
        );

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
        const { appendObject: field1 } = await AppendObject.Create(
          { name: FIELDS_NAMES.PARENT, weight: _.random(1, 100) },
        );
        const { appendObject: field2 } = await AppendObject.Create(
          { name: FIELDS_NAMES.PARENT, weight: _.random(101, 10000) },
        );

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
        const { appendObject: field1 } = await AppendObject.Create(
          { name: FIELDS_NAMES.PARENT, weight: _.random(-100, -10), activeVotes },
        );
        const { appendObject: field2 } = await AppendObject.Create(
          { name: FIELDS_NAMES.PARENT, weight: _.random(100, 1000) },
        );

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
        const { appendObject: field1 } = await AppendObject.Create(
          { name: FIELDS_NAMES.PARENT, weight: _.random(101, 1000), activeVotes },
        );
        const { appendObject: field2 } = await AppendObject.Create(
          { name: FIELDS_NAMES.PARENT, weight: _.random(50, 100) },
        );
        const { appendObject: field3 } = await AppendObject.Create(
          { name: FIELDS_NAMES.PARENT, weight: _.random(1, 40) },
        );

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
        const { appendObject: field1 } = await AppendObject.Create(
          { name: FIELDS_NAMES.PARENT, weight: _.random(100, 1000), activeVotes },
        );
        const { appendObject: field2 } = await AppendObject.Create(
          { name: FIELDS_NAMES.PARENT, weight: _.random(-100, -10) },
        );

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
    const fields = [];
    let updWobj, mockBody;

    beforeEach(async () => {
      mockBody = () => JSON.stringify({
        allowList: [['a', 'b'], ['c', 'd']],
        ignoreList: ['e', 'f', faker.random.string(3)],
      });
      const weight = [1, -99, 80, 100];
      let field;
      for (const num of weight) {
        ({ appendObject: field } = await AppendObject.Create(
          { name: FIELDS_NAMES.NEWS_FILTER, body: (mockBody()), weight: num },
        ));
        fields.push(field);
      }
      await WObject.findOneAndUpdate({ author_permlink: wobject.author_permlink }, { fields });
      await updateSpecificFieldsHelper.update(
        field.author, field.permlink, wobject.author_permlink,
      );
      updWobj = await WObject.findOne({ author_permlink: wobject.author_permlink }).lean();
    });

    it('should add field "newsFilter" to wobject', async () => {
      expect(updWobj.newsFilter).to.exist;
    });

    it('should write first field "newsFilter"', async () => {
      expect(updWobj.newsFilter).to.deep.equal(JSON.parse(fields[3].body));
    });
  });

  describe('on "tagCloud" field', () => {
    const fields = [], topFields = [];
    let updWobj;

    beforeEach(async () => {
      const weight = [1, -99, 80, 50, 11, -120, 100];
      let field;
      for (const num of weight) {
        ({ appendObject: field } = await AppendObject.Create(
          { name: FIELDS_NAMES.TAG_CLOUD, weight: num },
        ));
        fields.push(field);
        if (num > 0) topFields.push(field);
      }
      await WObject.findOneAndUpdate({ author_permlink: wobject.author_permlink }, { fields });
      await updateSpecificFieldsHelper.update(
        field.author, field.permlink, wobject.author_permlink,
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
    let fields = [], topFields = [];
    let updWobj;
    beforeEach(async () => {
      topFields = []; fields = [];
      const weight = [1, -99, 80, 50, 11, -120, 100];
      let field;
      for (const num of weight) {
        ({ appendObject: field } = await AppendObject.Create(
          { name: FIELDS_NAMES.RATING, weight: num },
        ));
        fields.push(field);
        if (num > 0 && topFields.length < RATINGS_UPDATE_COUNT) topFields.push(field);
      }

      await WObject.findOneAndUpdate({ author_permlink: wobject.author_permlink }, { fields });
      await updateSpecificFieldsHelper.update(
        field.author, field.permlink, wobject.author_permlink,
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
    const fields = [];
    let updWobj;

    beforeEach(async () => {
      const mockBody = () => JSON.stringify({
        longitude: faker.random.number({ min: -180, max: 180 }),
        latitude: faker.random.number({ min: -90, max: 90 }),
      });
      const weight = [1, -99, 80, 10];
      let field;
      for (const num of weight) {
        ({ appendObject: field } = await AppendObject.Create(
          { name: FIELDS_NAMES.MAP, weight: num, body: (mockBody()) },
        ));
        fields.push(field);
      }
      await WObject.findOneAndUpdate({ author_permlink: wobject.author_permlink }, { fields });
      await updateSpecificFieldsHelper.update(
        field.author, field.permlink, wobject.author_permlink,
      );
      updWobj = await WObject.findOne({ author_permlink: wobject.author_permlink }).lean();
    });

    it('should add field "map" to wobject', async () => {
      expect(updWobj.map).to.exist;
    });

    it('should write top field "map" to root of wobject', async () => {
      const mockBody = JSON.parse(fields[2].body);
      expect(updWobj.map).to.deep.equal({ type: 'Point', coordinates: [mockBody.longitude, mockBody.latitude] });
    });
  });

  describe('on "status" field', () => {
    let updWobj;

    beforeEach(async () => {
      const mockBody = () => JSON.stringify({ title: 'Unavailable', link: '' });
      const { appendObject: field1 } = await AppendObject.Create({
        root_wobj: wobject.author_permlink,
        name: FIELDS_NAMES.STATUS,
        body: (mockBody()),
        weight: 10,
      });
      await updateSpecificFieldsHelper.update(
        field1.author, field1.permlink, wobject.author_permlink,
      );
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
        await ObjectFactory.Create({ object_type: OBJECT_TYPES.HASHTAG }),
        await ObjectFactory.Create({ object_type: OBJECT_TYPES.HASHTAG }),
        await ObjectFactory.Create({ object_type: OBJECT_TYPES.HASHTAG }),
      ];

      const { appendObject: category1 } = await AppendObject.Create({
        root_wobj: wobject.author_permlink,
        name: FIELDS_NAMES.TAG_CATEGORY,
        body: faker.random.string(),
        additionalFields: { id: id1 },
      });
      await AppendObject.Create({
        root_wobj: wobject.author_permlink,
        name: FIELDS_NAMES.CATEGORY_ITEM,
        body: tagWobjects[0].author_permlink,
        additionalFields: { id: id1 },
      });
      await AppendObject.Create({
        root_wobj: wobject.author_permlink,
        name: FIELDS_NAMES.CATEGORY_ITEM,
        body: tagWobjects[1].author_permlink,
        additionalFields: { id: id1 },
      });
      await AppendObject.Create({
        root_wobj: wobject.author_permlink,
        name: FIELDS_NAMES.TAG_CATEGORY,
        body: faker.random.string(),
        additionalFields: { id: id2 },
      });
      await AppendObject.Create({
        root_wobj: wobject.author_permlink,
        name: FIELDS_NAMES.CATEGORY_ITEM,
        body: tagWobjects[2].author_permlink,
        additionalFields: { id: id2 },
      });
      await AppendObject.Create({
        root_wobj: wobject.author_permlink,
        name: FIELDS_NAMES.TAG_CATEGORY,
        body: faker.random.string(),
        additionalFields: { id: faker.random.string() },
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
        await ObjectFactory.Create({ object_type: OBJECT_TYPES.HASHTAG }),
        await ObjectFactory.Create({ object_type: OBJECT_TYPES.HASHTAG }),
        await ObjectFactory.Create({ object_type: OBJECT_TYPES.HASHTAG }),
      ];

      await AppendObject.Create({
        root_wobj: wobject.author_permlink,
        name: FIELDS_NAMES.TAG_CATEGORY,
        body: faker.random.string(),
        additionalFields: { id: id1 },
      });
      const { appendObject: categoryItem1 } = await AppendObject.Create({
        root_wobj: wobject.author_permlink,
        name: FIELDS_NAMES.CATEGORY_ITEM,
        body: tagWobjects[0].author_permlink,
        additionalFields: { id: id1 },
      });
      await AppendObject.Create({
        root_wobj: wobject.author_permlink,
        name: FIELDS_NAMES.CATEGORY_ITEM,
        body: tagWobjects[1].author_permlink,
        additionalFields: { id: id1 },
      });
      await AppendObject.Create({
        root_wobj: wobject.author_permlink,
        name: FIELDS_NAMES.TAG_CATEGORY,
        body: faker.random.string(),
        additionalFields: { id: id2 },
      });
      await AppendObject.Create({
        root_wobj: wobject.author_permlink,
        name: FIELDS_NAMES.CATEGORY_ITEM,
        body: tagWobjects[2].author_permlink,
        additionalFields: { id: id2 },
      });
      await AppendObject.Create({
        root_wobj: wobject.author_permlink,
        name: FIELDS_NAMES.TAG_CATEGORY,
        body: faker.random.string(),
        additionalFields: { id: faker.random.string() },
      });

      await updateSpecificFieldsHelper.update(
        categoryItem1.author, categoryItem1.permlink, wobject.author_permlink,
      );
      updWobj = await WObject.findOne({ author_permlink: wobject.author_permlink }).lean();
    });
    it('should create field "tagCategories" on wobject root', async () => {
      expect(updWobj.tagCategories).to.exist;
    });
    it('should create field "tagCategories" on wobject root with correct length', async () => {
      expect(updWobj.tagCategories.length).to.be.eq(3);
    });
  });

  describe('on authority field', async () => {
    let field;
    beforeEach(async () => {
      ({ appendObject: field } = await AppendObject.Create({
        root_wobj: wobject.author_permlink,
        name: FIELDS_NAMES.AUTHORITY,
        body: AUTHORITY_FIELD_ENUM.ADMINISTRATIVE,
      }));
    });
    it('should add creator to authority array when he create field', async () => {
      await updateSpecificFieldsHelper.update(
        field.author, field.permlink, wobject.author_permlink,
      );
      const result = await WObject.findOne({ author_permlink: wobject.author_permlink }).lean();
      expect(result.authority[AUTHORITY_FIELD_ENUM.ADMINISTRATIVE]).contains(field.creator);
    });
    it('should add creator to authority array when he like it', async () => {
      await updateSpecificFieldsHelper.update(
        field.author, field.permlink, wobject.author_permlink, field.creator, _.random(1, 100),
      );
      const result = await WObject.findOne({ author_permlink: wobject.author_permlink }).lean();
      expect(result.authority[AUTHORITY_FIELD_ENUM.ADMINISTRATIVE]).contains(field.creator);
    });
    it('should not add creator to authority array when another user like it', async () => {
      await updateSpecificFieldsHelper.update(
        field.author, field.permlink, wobject.author_permlink,
        faker.name.firstName(), _.random(1, 100),
      );
      const result = await WObject.findOne({ author_permlink: wobject.author_permlink }).lean();
      expect(result.authority[AUTHORITY_FIELD_ENUM.ADMINISTRATIVE]).to.be.empty;
    });
    it('should remove creator from authority array when he downVote it', async () => {
      await WObject.updateOne({ author_permlink: wobject.author_permlink },
        { $push: { [`authority.${AUTHORITY_FIELD_ENUM.ADMINISTRATIVE}`]: field.creator } });
      await updateSpecificFieldsHelper.update(
        field.author, field.permlink, wobject.author_permlink, field.creator, _.random(-1, -100),
      );
      const result = await WObject.findOne({ author_permlink: wobject.author_permlink }).lean();
      expect(result.authority[AUTHORITY_FIELD_ENUM.ADMINISTRATIVE]).to.be.undefined;
    });
    it('should not add creator to authority array when another user downVote it ', async () => {
      await WObject.updateOne({ author_permlink: wobject.author_permlink },
        { $push: { [`authority.${AUTHORITY_FIELD_ENUM.ADMINISTRATIVE}`]: field.creator } });
      await updateSpecificFieldsHelper.update(
        field.author, field.permlink, wobject.author_permlink,
        faker.name.firstName(), _.random(-1, -100),
      );
      const result = await WObject.findOne({ author_permlink: wobject.author_permlink }).lean();
      expect(result.authority[AUTHORITY_FIELD_ENUM.ADMINISTRATIVE]).contains(field.creator);
    });
  });
});
