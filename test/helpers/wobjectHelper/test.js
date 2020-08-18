const _ = require('lodash');
const {
  expect, sinon, importUpdates, wobjectHelper, faker, ObjectTypeModel, dropDatabase, config, WObject, postHelper,
} = require('test/testHelper');
const {
  ObjectTypeFactory, ObjectFactory, AppFactory, AppendObject,
} = require('test/factories');

describe('addSupposedUpdates', async () => {
  describe('on valid input', async () => {
    let objectType,
      wobject,
      importUpdatesStub,
      supposedUpdatesMock;
    beforeEach(async () => {
      supposedUpdatesMock = [{
        name: faker.address.city(),
        values: [faker.random.string(10)],
        id_path: faker.random.string(5),
      }];
      objectType = await ObjectTypeFactory.Create({ supposed_updates: supposedUpdatesMock });
      wobject = await ObjectFactory.Create({ object_type: objectType.name });
      importUpdatesStub = sinon.stub(importUpdates, 'send').callsFake(() => {});
      await wobjectHelper.addSupposedUpdates(wobject);
    });
    afterEach(() => importUpdatesStub.restore());

    it('should call importUpdates.send once', () => {
      expect(importUpdatesStub).to.be.calledOnce;
    });
    it('should call importUpdates.send with array param', () => {
      const call = importUpdatesStub.getCall(0);
      expect(Array.isArray(call.args[0])).to.be.true;
    });
    it('should call importUpdates.send with keys author_permlink, object_type and fields', () => {
      const call = importUpdatesStub.getCall(0);
      expect(call.args[0][0]).to.have.keys(['author_permlink', 'object_type', 'fields']);
    });
    it('should call importUpdates.send with correct field keys', () => {
      const call = importUpdatesStub.getCall(0);
      expect(call.args[0][0].fields[0]).to.have.keys(['name', 'body', 'permlink', 'creator', supposedUpdatesMock[0].id_path]);
    });
  });

  describe('on empty supposed_fields', async () => {
    let objectType,
      wobject,
      importUpdatesStub;
    beforeEach(async () => {
      objectType = await ObjectTypeFactory.Create();
      wobject = await ObjectFactory.Create({ object_type: objectType.name });
      importUpdatesStub = sinon.stub(importUpdates, 'send').callsFake(() => {});
      await wobjectHelper.addSupposedUpdates(wobject);
    });
    afterEach(() => importUpdatesStub.restore());

    it('should not call importUpdates.send', () => {
      expect(importUpdatesStub).to.be.not.called;
    });
  });

  describe('on ObjectType model returning error', async () => {
    let objectType,
      wobject,
      importUpdatesStub,
      ObjectTypeStub;
    beforeEach(async () => {
      objectType = await ObjectTypeFactory.Create();
      wobject = await ObjectFactory.Create({ object_type: objectType.name });
      ObjectTypeStub = sinon.stub(ObjectTypeModel, 'getOne').callsFake(() => ({ error: { message: 'Test error' } }));
      importUpdatesStub = sinon.stub(importUpdates, 'send').callsFake(() => {});
      await wobjectHelper.addSupposedUpdates(wobject);
    });
    afterEach(() => {
      importUpdatesStub.restore();
      ObjectTypeStub.restore();
    });

    it('should not call importUpdates.send', () => {
      expect(importUpdatesStub).to.be.not.called;
    });
  });
});

describe('getWobjWinField', async () => {
  let wobject, returnedValue, adminName, fieldName, fields = [];

  beforeEach(async () => {
    fieldName = faker.name.firstName();
    adminName = faker.name.firstName();
    await dropDatabase();
    wobject = await ObjectFactory.Create();
    await AppFactory.Create({ name: config.app, admins: [adminName] });
  });
  describe('when is there no admins likes and there is no fields with positive weight', async () => {
    beforeEach(async () => {
      const { appendObject: field1 } = await AppendObject.Create(
        { name: fieldName, weight: _.random(-100, -1) },
      );
      const { appendObject: field2 } = await AppendObject.Create(
        { name: fieldName, weight: _.random(-100, -1) },
      );

      fields = [field1, field2];
      await WObject.findOneAndUpdate({ author_permlink: wobject.author_permlink }, { fields });
      returnedValue = await wobjectHelper
        .getWobjWinField({ fieldName, authorPermlink: wobject.author_permlink });
    });

    it('getWobjWinField should return false', async () => {
      expect(returnedValue).to.be.false;
    });
  });
  describe('when is there no admins likes and one or more fields has positive weight', async () => {
    beforeEach(async () => {
      const { appendObject: field1 } = await AppendObject.Create(
        { name: fieldName, weight: _.random(1, 100) },
      );
      const { appendObject: field2 } = await AppendObject.Create(
        { name: fieldName, weight: _.random(101, 10000) },
      );

      fields = [field1, field2];
      await WObject.findOneAndUpdate({ author_permlink: wobject.author_permlink }, { fields });
      returnedValue = await wobjectHelper
        .getWobjWinField({ fieldName, authorPermlink: wobject.author_permlink });
    });

    it('second field should win', async () => {
      expect(returnedValue.body).to.be.eq(fields[1].body);
    });
  });
  describe('when has admin like his field always win', async () => {
    beforeEach(async () => {
      const activeVotes = [{
        _id: postHelper.objectIdFromDateString(new Date()),
        voter: adminName,
        percent: 100,
      }];
      const { appendObject: field1 } = await AppendObject.Create(
        { name: fieldName, weight: _.random(-100, -10), activeVotes },
      );
      const { appendObject: field2 } = await AppendObject.Create(
        { name: fieldName, weight: _.random(100, 1000) },
      );

      fields = [field1, field2];
      await WObject.findOneAndUpdate({ author_permlink: wobject.author_permlink }, { fields });
      returnedValue = await wobjectHelper
        .getWobjWinField({ fieldName, authorPermlink: wobject.author_permlink });
    });
    it('admin field should win', async () => {
      expect(returnedValue.body).to.be.eq(fields[0].body);
    });
  });
  describe('if admin dislike field even if it has big weight it will loose', async () => {
    beforeEach(async () => {
      const activeVotes = [{
        _id: postHelper.objectIdFromDateString(new Date()),
        voter: adminName,
        percent: -100,
      }];
      const { appendObject: field1 } = await AppendObject.Create(
        { name: fieldName, weight: _.random(101, 1000), activeVotes },
      );
      const { appendObject: field2 } = await AppendObject.Create(
        { name: fieldName, weight: _.random(50, 100) },
      );
      const { appendObject: field3 } = await AppendObject.Create(
        { name: fieldName, weight: _.random(1, 40) },
      );

      fields = [field1, field2, field3];
      await WObject.findOneAndUpdate({ author_permlink: wobject.author_permlink }, { fields });
      returnedValue = await wobjectHelper
        .getWobjWinField({ fieldName, authorPermlink: wobject.author_permlink });
    });

    it('should win field with no dislike with bigger weight', async () => {
      expect(returnedValue.body).to.be.eq(fields[1].body);
    });
  });
  describe('if admin dislike field and other fields has weight < 0 method should return false', async () => {
    beforeEach(async () => {
      const activeVotes = [{
        _id: postHelper.objectIdFromDateString(new Date()),
        voter: adminName,
        percent: -100,
      }];
      const { appendObject: field1 } = await AppendObject.Create(
        { name: fieldName, weight: _.random(100, 1000), activeVotes },
      );
      const { appendObject: field2 } = await AppendObject.Create(
        { name: fieldName, weight: _.random(-100, -10) },
      );

      fields = [field1, field2];
      await WObject.findOneAndUpdate({ author_permlink: wobject.author_permlink }, { fields });
      returnedValue = await wobjectHelper
        .getWobjWinField({ fieldName, authorPermlink: wobject.author_permlink });
    });
    it('getWobjWinField should return false', async () => {
      expect(returnedValue).to.be.false;
    });
  });
});
