const _ = require('lodash');
const {
  FIELDS_NAMES, RATINGS_UPDATE_COUNT, AUTHORITY_FIELD_ENUM, OBJECT_TYPES,
} = require('constants/wobjectsData');
const {
  expect, updateSpecificFieldsHelper, WObject, faker, dropDatabase, postHelper, config, App,
} = require('test/testHelper');
const { AppendObject, ObjectFactory, AppFactory } = require('test/factories');

describe('UpdateSpecificFieldsHelper', async () => {
  let wobject, parent;
  const map = { latitude: _.random(-90, 90), longitude: _.random(-180, 180) };
  beforeEach(async () => {
    await dropDatabase();
    wobject = await ObjectFactory.Create({ object_type: OBJECT_TYPES.RESTAURANT });
  });
  describe('on authors field', async () => {
    let appendObject, person1;
    beforeEach(async () => {
      person1 = await ObjectFactory.Create({ object_type: OBJECT_TYPES.PERSON });
      ({ appendObject, wobject } = await AppendObject.Create(
        {
          name: FIELDS_NAMES.AUTHORS,
          body: JSON.stringify({
            name: faker.random.string(),
            authorPermlink: person1.author_permlink,
          }),
        },
      ));
      await updateSpecificFieldsHelper.update({
        author: appendObject.author, permlink: appendObject.permlink, authorPermlink: wobject.author_permlink,
      });
      person1 = await WObject.findOne({ author_permlink: person1.author_permlink }).lean();
    });

    it('should children includes person1', async () => {
      expect(person1.children.includes(wobject.author_permlink)).to.be.true;
    });
  });

  describe('on publisher field', async () => {
    let appendObject, publisher;
    beforeEach(async () => {
      publisher = await ObjectFactory.Create({ object_type: OBJECT_TYPES.BUSINESS });
      ({ appendObject, wobject } = await AppendObject.Create(
        {
          name: FIELDS_NAMES.PUBLISHER,
          body: JSON.stringify({
            name: faker.random.string(),
            authorPermlink: publisher.author_permlink,
          }),
        },
      ));
      await updateSpecificFieldsHelper.update({
        author: appendObject.author, permlink: appendObject.permlink, authorPermlink: wobject.author_permlink,
      });
      publisher = await WObject.findOne({ author_permlink: publisher.author_permlink }).lean();
    });

    it('should children includes', async () => {
      expect(publisher.children.includes(wobject.author_permlink)).to.be.true;
    });
  });

  describe('on "parent" field', () => {
    let updWobj, fields = [], activeVotes;
    const adminName = faker.name.firstName();
    beforeEach(async () => {
      await AppFactory.Create({ host: config.appHost, admins: [adminName] });
    });
    describe('when is there no admins likes and there is no fields with positive percent', async () => {
      beforeEach(async () => {
        activeVotes = [{ percent: _.random(-100, -1) }];
        const { appendObject: field1 } = await AppendObject.Create(
          { name: FIELDS_NAMES.PARENT, activeVotes },
        );
        const { appendObject: field2 } = await AppendObject.Create(
          { name: FIELDS_NAMES.PARENT, activeVotes },
        );

        fields = [field1, field2];
        await WObject.findOneAndUpdate({ author_permlink: wobject.author_permlink }, { fields });
        await updateSpecificFieldsHelper.update({
          author: field1.author, permlink: field1.permlink, authorPermlink: wobject.author_permlink,
        });
        updWobj = await WObject.findOne({ author_permlink: wobject.author_permlink }).lean();
      });

      it('should leave parent field empty', async () => {
        expect(updWobj.parent).to.be.empty;
      });
    });
    describe('when is there no admins likes and one or more fields has positive percent', async () => {
      beforeEach(async () => {
        activeVotes = [{ percent: _.random(1, 100) }];
        const { appendObject: field1 } = await AppendObject.Create(
          { name: FIELDS_NAMES.PARENT, weight: _.random(1, 100), activeVotes },
        );
        const { appendObject: field2 } = await AppendObject.Create(
          { name: FIELDS_NAMES.PARENT, weight: _.random(101, 10000), activeVotes },
        );

        fields = [field1, field2];
        await WObject.findOneAndUpdate({ author_permlink: wobject.author_permlink }, { fields });
        await updateSpecificFieldsHelper.update({
          author: field1.author, permlink: field1.permlink, authorPermlink: wobject.author_permlink,
        });
        updWobj = await WObject.findOne({ author_permlink: wobject.author_permlink }).lean();
      });

      it('should write second field "parent"', async () => {
        expect(updWobj.parent).to.be.eq(fields[1].body);
      });
    });
    describe('when has admin like his field always win', async () => {
      beforeEach(async () => {
        activeVotes = [{
          _id: postHelper.objectIdFromDateString(new Date()),
          voter: adminName,
          percent: _.random(1, 100),
        }];
        const { appendObject: field1 } = await AppendObject.Create(
          { name: FIELDS_NAMES.PARENT, weight: _.random(-100, -10), activeVotes },
        );
        const { appendObject: field2 } = await AppendObject.Create({
          name: FIELDS_NAMES.PARENT,
          weight: _.random(100, 1000),
          activeVotes: [{ percent: _.random(1, 100) }],
        });

        fields = [field1, field2];
        await WObject.findOneAndUpdate({ author_permlink: wobject.author_permlink }, { fields });
        await updateSpecificFieldsHelper.update({
          author: field1.author, permlink: field1.permlink, authorPermlink: wobject.author_permlink,
        });
        updWobj = await WObject.findOne({ author_permlink: wobject.author_permlink }).lean();
      });
      it('should write admin field', async () => {
        expect(updWobj.parent).to.be.eq(fields[0].body);
      });
    });
    describe('if admin dislike field even if it has big weight it will loose', async () => {
      beforeEach(async () => {
        activeVotes = [{
          _id: postHelper.objectIdFromDateString(new Date()),
          voter: adminName,
          percent: _.random(-100, -1),
        }];
        const userVotes = [{ percent: _.random(1, 100) }];
        const { appendObject: field1 } = await AppendObject.Create(
          { name: FIELDS_NAMES.PARENT, weight: _.random(101, 1000), activeVotes },
        );
        const { appendObject: field2 } = await AppendObject.Create(
          { name: FIELDS_NAMES.PARENT, weight: _.random(50, 100), activeVotes: userVotes },
        );
        const { appendObject: field3 } = await AppendObject.Create(
          { name: FIELDS_NAMES.PARENT, weight: _.random(1, 40), activeVotes: userVotes },
        );

        fields = [field1, field2, field3];
        await WObject.findOneAndUpdate({ author_permlink: wobject.author_permlink }, { fields });
        await updateSpecificFieldsHelper.update({
          author: field1.author, permlink: field1.permlink, authorPermlink: wobject.author_permlink,
        });
        updWobj = await WObject.findOne({ author_permlink: wobject.author_permlink }).lean();
      });
      it('should write field with no dislike with bigger weight', async () => {
        expect(updWobj.parent).to.be.eq(fields[1].body);
      });
    });
    describe('if admin dislike field and other fields has no votes percent > 0 parent will be empty string', async () => {
      beforeEach(async () => {
        const userVotes = [{ percent: _.random(-100, -1) }];
        activeVotes = [{
          _id: postHelper.objectIdFromDateString(new Date()),
          voter: adminName,
          percent: _.random(-100, -1),
        }];
        const { appendObject: field1 } = await AppendObject.Create(
          { name: FIELDS_NAMES.PARENT, weight: _.random(100, 1000), activeVotes },
        );
        const { appendObject: field2 } = await AppendObject.Create(
          { name: FIELDS_NAMES.PARENT, weight: _.random(-100, -10), activeVotes: userVotes },
        );

        fields = [field1, field2];
        await WObject.findOneAndUpdate({ author_permlink: wobject.author_permlink }, { fields });
        await updateSpecificFieldsHelper.update({
          author: field1.author, permlink: field1.permlink, authorPermlink: wobject.author_permlink,
        });
        updWobj = await WObject.findOne({ author_permlink: wobject.author_permlink }).lean();
      });
      it('should be empty string', async () => {
        expect(updWobj.parent).to.be.empty;
      });
    });
    describe('if parent has map in fields and child not', async () => {
      beforeEach(async () => {
        parent = await ObjectFactory.Create();
        activeVotes = [{ percent: _.random(1, 100) }];
        const { appendObject: field1 } = await AppendObject.Create(
          {
            weight: _.random(1, 100),
            body: parent.author_permlink,
            name: FIELDS_NAMES.PARENT,
            activeVotes,
            root_wobj: wobject.author_permlink,
          },
        );
        await AppendObject.Create(
          {
            weight: _.random(1, 100),
            body: JSON.stringify(map),
            name: FIELDS_NAMES.MAP,
            activeVotes,
            root_wobj: parent.author_permlink,
          },
        );
        await updateSpecificFieldsHelper.update({
          author: field1.author, permlink: field1.permlink, authorPermlink: wobject.author_permlink,
        });
        updWobj = await WObject.findOne({ author_permlink: wobject.author_permlink }).lean();
      });
      it('should be same coordinates at map as a win field parent', async () => {
        expect(updWobj.map.coordinates).to.be.deep.eq(Object.values(map).reverse());
      });
    });
    describe('if parent has map in fields and child has too', async () => {
      beforeEach(async () => {
        parent = await ObjectFactory.Create();
        activeVotes = [{ percent: _.random(1, 100) }];
        const { appendObject: field1 } = await AppendObject.Create(
          {
            root_wobj: wobject.author_permlink,
            weight: _.random(1, 100),
            body: parent.author_permlink,
            name: FIELDS_NAMES.PARENT,
            activeVotes,
          },
        );
        await AppendObject.Create(
          {
            root_wobj: wobject.author_permlink,
            weight: _.random(1, 100),
            body: JSON.stringify(map),
            name: FIELDS_NAMES.MAP,
            activeVotes,
          },
        );
        await AppendObject.Create(
          {
            root_wobj: parent.author_permlink,
            weight: _.random(1, 100),
            body: JSON.stringify(map),
            name: FIELDS_NAMES.MAP,
            activeVotes,
          },
        );
        await updateSpecificFieldsHelper.update({
          author: field1.author, permlink: field1.permlink, authorPermlink: wobject.author_permlink,
        });
        updWobj = await WObject.findOne({ author_permlink: wobject.author_permlink }).lean();
      });
      it('map should be null', async () => {
        expect(updWobj.map).to.be.null;
      });
    });
    describe('if parent has no map', async () => {
      beforeEach(async () => {
        parent = await ObjectFactory.Create();
        activeVotes = [{ percent: _.random(1, 100) }];
        const { appendObject: field1 } = await AppendObject.Create(
          {
            root_wobj: wobject.author_permlink,
            weight: _.random(1, 100),
            body: parent.author_permlink,
            name: FIELDS_NAMES.PARENT,
            activeVotes,
          },
        );
        await updateSpecificFieldsHelper.update({
          author: field1.author, permlink: field1.permlink, authorPermlink: wobject.author_permlink,
        });
        updWobj = await WObject.findOne({ author_permlink: wobject.author_permlink }).lean();
      });
      it('map should be null', async () => {
        expect(updWobj.map).to.be.null;
      });
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
      await updateSpecificFieldsHelper.update({
        author: field.author, permlink: field.permlink, authorPermlink: wobject.author_permlink,
      });
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
      await updateSpecificFieldsHelper.update({
        author: field.author, permlink: field.permlink, authorPermlink: wobject.author_permlink,
      });
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
    const child1 = faker.random.string();
    const child2 = faker.random.string();
    const child3 = faker.random.string();
    beforeEach(async () => {
      const mockBody = () => JSON.stringify({
        longitude: faker.random.number({ min: -180, max: 180 }),
        latitude: faker.random.number({ min: -90, max: 90 }),
      });
      const children = [child1, child2, child3];
      const weight = [1, -99, 80, 10];
      let field;
      for (const num of weight) {
        ({ appendObject: field } = await AppendObject.Create(
          { name: FIELDS_NAMES.MAP, weight: num, body: (mockBody()) },
        ));
        fields.push(field);
      }
      for (const el of children) {
        await ObjectFactory.Create({ objParent: wobject.author_permlink, author_permlink: el });
        if (el === child1) {
          await AppendObject.Create(
            {
              root_wobj: child1,
              weight: _.random(1, 100),
              body: JSON.stringify(map),
              name: FIELDS_NAMES.MAP,
            },
          );
        }
      }
      await WObject.findOneAndUpdate({ author_permlink: wobject.author_permlink }, { fields });
      await updateSpecificFieldsHelper.update({
        author: field.author, permlink: field.permlink, authorPermlink: wobject.author_permlink,
      });
      updWobj = await WObject.findOne({ author_permlink: wobject.author_permlink }).lean();
    });

    it('should add field "map" to wobject', async () => {
      expect(updWobj.map).to.exist;
    });
    it('should write top field "map" to root of wobject', async () => {
      const mockBody = JSON.parse(fields[2].body);
      expect(updWobj.map).to.deep.equal({ type: 'Point', coordinates: [mockBody.longitude, mockBody.latitude] });
    });
    it('should not update map because child1 has field map', async () => {
      const result = await WObject.findOne({ author_permlink: child1 }).lean();
      expect(result.map).to.be.null;
    });
    it('should set parent map for child2', async () => {
      const mockBody = JSON.parse(fields[2].body);
      const result = await WObject.findOne({ author_permlink: child2 }).lean();
      expect(result.map).to.deep.equal({ type: 'Point', coordinates: [mockBody.longitude, mockBody.latitude] });
    });
    it('should set parent map for child3', async () => {
      const mockBody = JSON.parse(fields[2].body);
      const result = await WObject.findOne({ author_permlink: child3 }).lean();
      expect(result.map).to.deep.equal({ type: 'Point', coordinates: [mockBody.longitude, mockBody.latitude] });
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
      await updateSpecificFieldsHelper.update({
        author: field1.author, permlink: field1.permlink, authorPermlink: wobject.author_permlink,
      });
      updWobj = await WObject.findOne({ author_permlink: wobject.author_permlink }).lean();
    });

    it('should add field "status" to wobject', async () => {
      expect(updWobj.status).to.exist;
    });
    it('should write top field "status" to root of wobject', async () => {
      expect(updWobj.status).to.deep.equal({ title: 'Unavailable', link: '' });
    });
  });
  describe('on authority field', async () => {
    let field, app;
    beforeEach(async () => {
      ({ appendObject: field, wobject } = await AppendObject.Create({
        root_wobj: wobject.author_permlink,
        name: FIELDS_NAMES.AUTHORITY,
        body: AUTHORITY_FIELD_ENUM.ADMINISTRATIVE,
      }));
      app = await AppFactory.Create({ authority: [] });
    });
    it('should add creator to authority array when he create field', async () => {
      await updateSpecificFieldsHelper.update({
        author: field.author, permlink: field.permlink, authorPermlink: wobject.author_permlink,
      });
      const result = await WObject.findOne({ author_permlink: wobject.author_permlink }).lean();
      expect(result.authority[AUTHORITY_FIELD_ENUM.ADMINISTRATIVE]).contains(field.creator);
    });
    it('should add creator to authority array when he like it', async () => {
      await updateSpecificFieldsHelper.update({
        author: field.author,
        permlink: field.permlink,
        authorPermlink: wobject.author_permlink,
        voter: field.creator,
        percent: _.random(1, 100),
      });
      const result = await WObject.findOne({ author_permlink: wobject.author_permlink }).lean();
      expect(result.authority[AUTHORITY_FIELD_ENUM.ADMINISTRATIVE]).contains(field.creator);
    });
    it('should not add creator to authority array when another user like it', async () => {
      await updateSpecificFieldsHelper.update({
        author: field.author,
        permlink: field.permlink,
        authorPermlink: wobject.author_permlink,
        voter: faker.name.firstName(),
        percent: _.random(1, 100),
      });
      const result = await WObject.findOne({ author_permlink: wobject.author_permlink }).lean();
      expect(result.authority[AUTHORITY_FIELD_ENUM.ADMINISTRATIVE]).to.be.empty;
    });
    it('should remove creator from authority array when he downVote it', async () => {
      await WObject.updateOne({ author_permlink: wobject.author_permlink },
        { $push: { [`authority.${AUTHORITY_FIELD_ENUM.ADMINISTRATIVE}`]: field.creator } });
      await updateSpecificFieldsHelper.update({
        author: field.author,
        permlink: field.permlink,
        authorPermlink: wobject.author_permlink,
        voter: field.creator,
        percent: _.random(-1, -100),
      });
      const result = await WObject.findOne({ author_permlink: wobject.author_permlink }).lean();
      expect(result.authority[AUTHORITY_FIELD_ENUM.ADMINISTRATIVE]).to.be.empty;
    });
    it('should not add creator to authority array when another user downVote it ', async () => {
      await WObject.updateOne({ author_permlink: wobject.author_permlink },
        { $push: { [`authority.${AUTHORITY_FIELD_ENUM.ADMINISTRATIVE}`]: field.creator } });
      await updateSpecificFieldsHelper.update({
        author: field.author,
        permlink: field.permlink,
        authorPermlink: wobject.author_permlink,
        voter: faker.name.firstName(),
        percent: _.random(-1, -100),
      });
      const result = await WObject.findOne({ author_permlink: wobject.author_permlink }).lean();
      expect(result.authority[AUTHORITY_FIELD_ENUM.ADMINISTRATIVE]).contains(field.creator);
    });
    it('should add supported object to app when authority claim authority', async () => {
      await App.updateOne({ $set: { authority: [field.creator] } });
      await updateSpecificFieldsHelper.update({
        author: field.author, permlink: field.permlink, authorPermlink: wobject.author_permlink,
      });
      const result = await App.findOne({ _id: app._id });
      expect(result.supported_objects).to.include(wobject.author_permlink);
    });
    it('should remove supported object from app when authority downvote his field', async () => {
      await WObject.updateOne({ author_permlink: wobject.author_permlink },
        { $push: { [`authority.${AUTHORITY_FIELD_ENUM.ADMINISTRATIVE}`]: field.creator } });
      await App.updateOne({ $set: { authority: [field.creator], supported_objects: [wobject.author_permlink] } });
      await updateSpecificFieldsHelper.update({
        author: field.author,
        permlink: field.permlink,
        authorPermlink: wobject.author_permlink,
        voter: field.creator,
        percent: _.random(-1, -100),
      });
      const result = await App.findOne({ _id: app._id });
      expect(result.supported_objects).to.not.include(wobject.author_permlink);
    });
    it('should not remove object from supported if another authority still claim it', async () => {
      const anotherAuthority = faker.random.string();
      await WObject.updateOne({ author_permlink: wobject.author_permlink },
        { $set: { [`authority.${AUTHORITY_FIELD_ENUM.ADMINISTRATIVE}`]: [field.creator, anotherAuthority] } });
      await App.updateOne({ $set: { authority: [field.creator, anotherAuthority], supported_objects: [wobject.author_permlink] } });
      await updateSpecificFieldsHelper.update({
        author: field.author,
        permlink: field.permlink,
        authorPermlink: wobject.author_permlink,
        voter: field.creator,
        percent: _.random(-1, -100),
      });
      const result = await App.findOne({ _id: app._id });
      expect(result.supported_objects).to.include(wobject.author_permlink);
    });
  });
  describe('on processingParent', async () => {
    let wobject, field, result;
    beforeEach(async () => {
      await dropDatabase();
      await AppFactory.Create({ host: config.appHost });
      wobject = await ObjectFactory.Create();
    });
    describe('when exist fields with positive weight with no dislikes', async () => {
      beforeEach(async () => {
        ({ appendObject: field } = await AppendObject.Create(
          { name: FIELDS_NAMES.PARENT, weight: _.random(100, 1000) },
        ));
        await WObject.findOneAndUpdate(
          { author_permlink: wobject.author_permlink }, { fields: [field] },
        );
        await updateSpecificFieldsHelper.processingParent(wobject.author_permlink);
        result = await WObject.findOne({ author_permlink: wobject.author_permlink }).lean();
      });
      it('parent name should be same in field body and result parent', async () => {
        expect(result.parent).to.be.eq(field.body);
      });
    });
    describe('when field downvoted', async () => {
      beforeEach(async () => {
        const userVotes = [{ percent: _.random(-100, -1) }];
        ({ appendObject: field } = await AppendObject.Create(
          { name: FIELDS_NAMES.PARENT, activeVotes: userVotes },
        ));
        await WObject.findOneAndUpdate(
          { author_permlink: wobject.author_permlink }, { fields: [field] },
        );
        await updateSpecificFieldsHelper.processingParent(wobject.author_permlink);
        result = await WObject.findOne({ author_permlink: wobject.author_permlink }).lean();
      });
      it('parent name should be same in field body and result parent', async () => {
        expect(result.parent).to.be.empty;
      });
    });
  });
});
