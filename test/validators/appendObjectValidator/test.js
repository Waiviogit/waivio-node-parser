const {
  expect, faker, ObjectType, WObject, sinon, AppModel,
} = require('test/testHelper');
const { appendObjectValidator } = require('validator');
const { ObjectFactory, AppendObject } = require('test/factories');
const _ = require('lodash');
const {
  FIELDS_NAMES,
  WEIGHT_UNITS,
  DIMENSION_UNITS,
  OBJECT_TYPES,
} = require('../../../constants/wobjectsData');

describe('appendObjectValidator', async () => {
  let wobject, mockData, mockOp, blackList;

  beforeEach(async () => {
    blackList = [faker.random.string(), faker.random.string()];
    sinon.stub(AppModel, 'findOne').returns(Promise.resolve({ result: { black_list_users: blackList } }));
    wobject = await ObjectFactory.Create();
    mockData = {
      author_permlink: wobject.author_permlink,
      field: {
        name: faker.random.string(),
        body: faker.random.string(),
        locale: 'en-US',
        creator: faker.name.firstName().toLowerCase(),
        author: faker.name.firstName().toLowerCase(),
        permlink: faker.random.string(15),
      },
    };
    mockOp = {
      parent_author: wobject.author,
      parent_permlink: wobject.author_permlink,
      author: faker.random.string(),
      permlink: faker.random.string(),
    };
  });
  afterEach(async () => {
    sinon.restore();
  });

  describe('on valid input', async () => {
    it('should not throw error if all fields is exist', async () => {
      await expect(appendObjectValidator.validate(mockData, mockOp)).to.not.be.rejected;
    });
  });

  describe('validate the same fields', async () => {
    let newWobj;
    beforeEach(async () => {
      newWobj = await ObjectFactory.Create({ appends: [mockData.field] });
    });
    describe('on valid input', async () => {
      it('should not throw error with the same field in another locale', async () => {
        mockData.field.locale = 'ru-RU';
        mockData.author_permlink = newWobj.author_permlink;
        await expect(appendObjectValidator.validate(mockData, mockOp)).to.not.be.rejected;
      });
      it('should not throw error if body of added field is different', async () => {
        mockData.field.body = faker.random.string(20);
        mockData.author_permlink = newWobj.author_permlink;
        await expect(appendObjectValidator.validate(mockData, mockOp)).to.not.be.rejected;
      });
    });
    describe('on invalid input', async () => {
      it('should throw error with the same field ', async () => {
        mockData.author_permlink = newWobj.author_permlink;
        await expect(appendObjectValidator.validate(mockData, mockOp)).to.be.rejected;
      });
      it('should rejected with error message if added the same field', async () => {
        mockData.author_permlink = newWobj.author_permlink;
        await expect(appendObjectValidator.validate(mockData, mockOp))
          .to.be.rejectedWith(Error, "Can't append object, the same field already exists");
      });
    });
  });
  describe('on invalid input', async () => {
    describe('when data do not contain all keys', async () => {
      const requiredKeys = 'name,body,locale,author,permlink,creator'.split(',');

      for (const key of requiredKeys) {
        it(`should be rejected without ${key}`, async () => {
          delete mockData.field[key];
          await expect(appendObjectValidator.validate(mockData, mockOp)).to.be.rejected;
        });
      }
      for (const key of requiredKeys) {
        it(`should be rejected without ${key} with correct message`, async () => {
          delete mockData.field[key];
          await expect(appendObjectValidator.validate(mockData, mockOp))
            .to.be.rejectedWith(Error, "Can't append object, not all required fields is filling!");
        });
      }
    });

    describe('when parent comment is not createobject comment', async () => {
      it('should be rejected if parent_author wrong', async () => {
        mockOp.parent_author = faker.random.string(10);
        await expect(appendObjectValidator.validate(mockData, mockOp)).to.be.rejected;
      });
      it('should be rejected if parent_author wrong with corr. message', async () => {
        mockOp.parent_author = faker.random.string(10);
        await expect(appendObjectValidator.validate(mockData, mockOp))
          .to.be.rejectedWith(Error, "Can't append object, parent comment isn't create Object comment!");
      });
      it('should be rejected if parent_permlink wrong', async () => {
        mockOp.parent_permlink = faker.random.string(10);
        await expect(appendObjectValidator.validate(mockData, mockOp)).to.be.rejected;
      });
      it('should be rejected if parent_permlink wrong with corr. message', async () => {
        mockOp.parent_author = faker.random.string(10);
        await expect(appendObjectValidator.validate(mockData, mockOp))
          .to.be.rejectedWith(Error, "Can't append object, parent comment isn't create Object comment!");
      });
    });

    describe('when try to add already existing append', async () => {
      let existAppend;
      beforeEach(async () => {
        const { appendObject } = await AppendObject.Create();
        existAppend = appendObject;
      });
      it('should be rejected if append with the same author and permlink already exists', async () => {
        mockOp.author = existAppend.author;
        mockOp.permlink = existAppend.permlink;
        await expect(appendObjectValidator.validate(mockData, mockOp)).to.be.rejected;
      });
      it('should be rejected with corr. message if append with the same author and permlink already exists', async () => {
        mockOp.author = existAppend.author;
        mockOp.permlink = existAppend.permlink;
        await expect(appendObjectValidator.validate(mockData, mockOp))
          .to.be.rejectedWith(Error, "Can't append object, append is now exist!");
      });
    });

    describe('when field in black list for current ObjectType', async () => {
      let blackListFieldName;
      beforeEach(async () => {
        blackListFieldName = faker.random.string();

        const objectType = await ObjectType.findOne({ name: wobject.object_type });
        objectType.updates_blacklist = [blackListFieldName];
        await objectType.save();
        mockData.field.name = blackListFieldName;
      });
      it('should be rejected with Error', async () => {
        await expect(appendObjectValidator.validate(mockData, mockOp)).to.be.rejected;
      });
      it('should be rejected with message about blacklist', async () => {
        await expect(appendObjectValidator.validate(mockData, mockOp))
          .to.be.rejectedWith(Error, `Can't append object, field ${blackListFieldName} in black list for object type ${wobject.object_type}!`);
      });
    });

    describe('when wobject not exist', async () => {
      it('should be rejected', async () => {
        await WObject.deleteOne({ author_permlink: wobject.author_permlink });
        await expect(appendObjectValidator.validate(mockData, mockOp)).to.be.rejected;
      });
    });

    describe('when object type not exist', async () => {
      it('should be rejected', async () => {
        await ObjectType.deleteOne({ name: wobject.object_type });
        await expect(appendObjectValidator.validate(mockData, mockOp)).to.be.rejected;
      });
    });

    describe('when user on blacklist', async () => {
      it('should be rejected if author of operation in blacklist', async () => {
        mockOp.author = blackList[0];
        mockData.field.author = mockOp.author;
        await expect(appendObjectValidator.validate(mockData, mockOp)).to.be.rejected;
      });
      it('should be rejected with correct message if author of operation in blacklist', async () => {
        mockOp.author = blackList[0];
        mockData.field.author = mockOp.author;
        await expect(appendObjectValidator.validate(mockData, mockOp))
          .to.be.rejectedWith(Error, "Can't append object, user in blacklist!");
      });
      it('should be rejected if creator of "append" in blacklist', async () => {
        mockData.field.creator = blackList[0];
        await expect(appendObjectValidator.validate(mockData, mockOp)).to.be.rejected;
      });
    });

    describe('when validateSpecifiedFields', async () => {
      describe('on publisher field', async () => {
        let publisher, randomType;
        beforeEach(async () => {
          mockData.field.name = FIELDS_NAMES.PUBLISHER;
          publisher = await ObjectFactory.Create({ object_type: OBJECT_TYPES.BUSINESS });
          randomType = await ObjectFactory.Create({ object_type: _.sample(_.filter(Object.values(OBJECT_TYPES), OBJECT_TYPES.BUSINESS)) });
        });
        it('should be fulfilled if body valid', async () => {
          mockData.field.body = JSON.stringify({
            name: faker.random.string(),
            authorPermlink: publisher.author_permlink,
          });
          await expect(appendObjectValidator.validate(mockData, mockOp)).to.be.fulfilled;
        });

        it('should be rejected if  type invalid', async () => {
          mockData.field.body = JSON.stringify({
            name: faker.random.string(),
            authorPermlink: randomType.author_permlink,
          });
          await expect(appendObjectValidator.validate(mockData, mockOp)).to.be.rejected;
        });

        it('should be rejected if on bad data', async () => {
          mockData.field.body = JSON.stringify({
            name: faker.random.string(),
            authorPermlink: faker.random.string(),
          });
          await expect(appendObjectValidator.validate(mockData, mockOp)).to.be.rejected;
        });
      });

      describe('on author field', async () => {
        let author1, author2, randomType;
        beforeEach(async () => {
          mockData.field.name = FIELDS_NAMES.AUTHORS;
          author1 = await ObjectFactory.Create({ object_type: OBJECT_TYPES.PERSON });
          author2 = await ObjectFactory.Create({ object_type: OBJECT_TYPES.PERSON });
          randomType = await ObjectFactory.Create({ object_type: _.sample(_.filter(Object.values(OBJECT_TYPES), OBJECT_TYPES.PERSON)) });
        });
        it('should be fulfilled if body valid', async () => {
          mockData.field.body = JSON.stringify([{
            name: faker.random.string(),
            authorPermlink: author1.author_permlink,
          },
          {
            name: faker.random.string(),
            authorPermlink: author2.author_permlink,
          },
          ]);
          await expect(appendObjectValidator.validate(mockData, mockOp)).to.be.fulfilled;
        });

        it('should be rejected if one type invalid', async () => {
          mockData.field.body = JSON.stringify([{
            name: faker.random.string(),
            authorPermlink: author1.author_permlink,
          },
          {
            name: faker.random.string(),
            authorPermlink: randomType.author_permlink,
          },
          ]);
          await expect(appendObjectValidator.validate(mockData, mockOp)).to.be.rejected;
        });

        it('should be rejected if on bad data', async () => {
          mockData.field.body = JSON.stringify([{
            name: faker.random.string(),
            authorPermlink: _.random(1, 100),
          },
          {
            name: faker.random.string(),
            authorPermlink: randomType.author_permlink,
          },
          ]);
          await expect(appendObjectValidator.validate(mockData, mockOp)).to.be.rejected;
        });
      });
      describe('on weight field', async () => {
        beforeEach(() => {
          mockData.field.name = FIELDS_NAMES.WEIGHT;
        });
        it('should be fulfilled if body valid', async () => {
          mockData.field.body = JSON.stringify({
            value: _.random(1, 100),
            unit: _.sample(WEIGHT_UNITS),
          });
          await expect(appendObjectValidator.validate(mockData, mockOp)).to.be.fulfilled;
        });

        it('should be rejected if body unit not on list', async () => {
          mockData.field.body = JSON.stringify({
            value: _.random(1, 100),
            unit: faker.random.string(),
          });
          await expect(appendObjectValidator.validate(mockData, mockOp)).to.be.rejected;
        });

        it('should be with wrong data types', async () => {
          mockData.field.body = JSON.stringify({
            value: faker.random.string(),
            unit: _.random(1, 100),
          });
          await expect(appendObjectValidator.validate(mockData, mockOp)).to.be.rejected;
        });
      });

      describe('on dimensions field', async () => {
        beforeEach(() => {
          mockData.field.name = FIELDS_NAMES.DIMENSIONS;
        });
        it('should be fulfilled if body valid', async () => {
          mockData.field.body = JSON.stringify({
            length: _.random(1, 100),
            width: _.random(1, 100),
            depth: _.random(1, 100),
            unit: _.sample(DIMENSION_UNITS),
          });
          await expect(appendObjectValidator.validate(mockData, mockOp)).to.be.fulfilled;
        });

        it('should be rejected if body unit not on list', async () => {
          mockData.field.body = JSON.stringify({
            length: _.random(1, 100),
            width: _.random(1, 100),
            depth: _.random(1, 100),
            unit: faker.random.string(),
          });
          await expect(appendObjectValidator.validate(mockData, mockOp)).to.be.rejected;
        });

        it('should be with negative values', async () => {
          mockData.field.body = JSON.stringify({
            length: _.random(-99, -1),
            width: _.random(-99, -1),
            depth: _.random(-99, -1),
            unit: _.sample(DIMENSION_UNITS),
          });
          await expect(appendObjectValidator.validate(mockData, mockOp)).to.be.rejected;
        });
      });

      describe('on options field', async () => {
        beforeEach(() => {
          mockData.field.name = FIELDS_NAMES.OPTIONS;
        });
        it('should be fulfilled if body valid', async () => {
          mockData.field.body = JSON.stringify({
            category: faker.random.string(),
            value: faker.random.string(),
          });
          await expect(appendObjectValidator.validate(mockData, mockOp)).to.be.fulfilled;
        });

        it('should be rejected if body has no category', async () => {
          mockData.field.body = JSON.stringify({
            category: faker.random.string(),
          });
          await expect(appendObjectValidator.validate(mockData, mockOp)).to.be.rejected;
        });

        it('should be rejected if body has no value', async () => {
          mockData.field.body = JSON.stringify({
            value: faker.random.string(),
          });
          await expect(appendObjectValidator.validate(mockData, mockOp)).to.be.rejected;
        });
      });

      describe('on parent field', async () => {
        it('should be rejected if body refer to non existing wobject', async () => {
          mockData.field.name = 'parent';
          mockData.field.body = faker.random.string(10);
          await expect(appendObjectValidator.validate(mockData, mockOp)).to.be.rejected;
        });
      });

      describe('on newsFilter field', async () => {
        it('should be rejected if body is not valid stringified JSON', async () => {
          mockData.field.name = 'newsFilter';
          mockData.field.body = '{lalalla, lalalalal}';
          await expect(appendObjectValidator.validate(mockData, mockOp)).to.be.rejected;
        });

        it('should be rejected if body is not valid newsFilter format data', async () => {
          mockData.field.name = 'newsFilter';
          mockData.field.body = '{"allowList":[], "ignorelist":[]}';
          await expect(appendObjectValidator.validate(mockData, mockOp)).to.be.rejected;
        });
      });

      describe('on map field', async () => {
        it('should be rejected if body is not valid stringified JSON', async () => {
          mockData.field.name = 'map';
          mockData.field.body = '{lalalla:lalala lalala, allala}';
          await expect(appendObjectValidator.validate(mockData, mockOp)).to.be.rejected;
        });

        it('should be rejected if latitude not number', async () => {
          mockData.field.name = 'map';
          mockData.field.body = '{"latitude":"aa", "longitude":123}';
          await expect(appendObjectValidator.validate(mockData, mockOp)).to.be.rejected;
        });

        it('should be rejected if longitude not number', async () => {
          mockData.field.name = 'map';
          mockData.field.body = '{"latitude":123, "longitude":"a123"}';
          await expect(appendObjectValidator.validate(mockData, mockOp)).to.be.rejected;
        });

        it('should be rejected without longitude', async () => {
          mockData.field.name = 'map';
          mockData.field.body = '{"latitude":123}';
          await expect(appendObjectValidator.validate(mockData, mockOp)).to.be.rejected;
        });

        it('should be rejected without latitude', async () => {
          mockData.field.name = 'map';
          mockData.field.body = '{"longitude":123}';
          await expect(appendObjectValidator.validate(mockData, mockOp)).to.be.rejected;
        });

        it('should be rejected if longitude less than -180', async () => {
          mockData.field.name = 'map';
          mockData.field.body = '{"latitude":123, "longitude": -181}';
          await expect(appendObjectValidator.validate(mockData, mockOp)).to.be.rejected;
        });

        it('should be rejected if longitude greater than 180', async () => {
          mockData.field.name = 'map';
          mockData.field.body = '{"latitude":123, "longitude": 181}';
          await expect(appendObjectValidator.validate(mockData, mockOp)).to.be.rejected;
        });

        it('should be rejected if latitude less than -90', async () => {
          mockData.field.name = 'map';
          mockData.field.body = '{"latitude":-91, "longitude": 10}';
          await expect(appendObjectValidator.validate(mockData, mockOp)).to.be.rejected;
        });

        it('should be rejected if latitude greater than 90', async () => {
          mockData.field.name = 'map';
          mockData.field.body = '{"latitude":91, "longitude": 10}';
          await expect(appendObjectValidator.validate(mockData, mockOp)).to.be.rejected;
        });
      });

      describe('on tagCategory field', async () => {
        it('should be rejected if field doesnt contain "id" property', async () => {
          mockData.field.name = 'tagCategory';
          await expect(appendObjectValidator.validate(mockData, mockOp)).to.be.rejected;
        });
        it('should be rejected if category with the same "id" already exist', async () => {
          mockData.field.name = 'tagCategory';
          mockData.field.id = faker.random.string(10);
          await AppendObject.Create({ root_wobj: wobject.author_permlink, name: 'tagCategory', additionalFields: { id: mockData.field.id } });
          await expect(appendObjectValidator.validate(mockData, mockOp)).to.be.rejected;
        });
      });

      describe('on categoryItem field', async () => {
        it('should be rejected if field doesnt contain "id" property', async () => {
          mockData.field.name = 'categoryItem';
          await expect(appendObjectValidator.validate(mockData, mockOp)).to.be.rejected;
        });

        it('should be rejected if field body refer to non existing wobject', async () => {
          mockData.field.name = 'categoryItem';
          mockData.field.id = faker.random.string(15);
          mockData.field.body = faker.random.string(20);
          await expect(appendObjectValidator.validate(mockData, mockOp)).to.be.rejected;
        });

        it('should be rejected if tagCategory with the same "id" doesn\'t exist', async () => {
          const hashtagWobj = await ObjectFactory.Create({ object_type: 'hashtag' });
          mockData.field.name = 'categoryItem';
          mockData.field.id = faker.random.string(15);
          mockData.field.body = hashtagWobj.author_permlink;
          await expect(appendObjectValidator.validate(mockData, mockOp)).to.be.rejected;
        });

        it('should be rejected if categoryItem with the same id, name and body already exist', async () => {
          const hashtagWobj = await ObjectFactory.Create({ object_type: 'hashtag' });
          mockData.field.name = 'categoryItem';
          mockData.field.id = faker.random.string(15);
          mockData.field.body = hashtagWobj.author_permlink;
          await AppendObject.Create({
            root_wobj: wobject.author_permlink, name: 'categoryItem', body: hashtagWobj.author_permlink, id: mockData.field.id,
          });
          await expect(appendObjectValidator.validate(mockData, mockOp)).to.be.rejected;
        });
      });
    });
  });
});
