const _ = require('lodash');
const {
  postHelper, faker, expect, dropDatabase, RelatedAlbum,
} = require('test/testHelper');
const { ObjectFactory, RelatedFactory } = require('test/factories');

describe('On postHelper', async () => {
  describe('On parseBodyWobjects', async () => {
    let mockHashtag, mockHashtag2, metadata, wobjects, mockObject;
    beforeEach(async () => {
      mockObject = await ObjectFactory.Create();
      mockHashtag = await ObjectFactory.Create({ object_type: 'hashtag' });
      mockHashtag2 = await ObjectFactory.Create({ object_type: 'hashtag' });
    });
    describe('case isSimplePost && postTags.length', async () => {
      it('should one hash tag have percent 100', async () => {
        metadata = { tags: [mockHashtag.author_permlink] };
        wobjects = await postHelper.parseBodyWobjects(metadata);
        expect(wobjects).to.be.deep.eq([{
          author_permlink: mockHashtag.author_permlink,
          percent: 100,
          tagged: mockHashtag.author_permlink,
        }]);
      });
    });
    describe('case wobj.wobjects && !isSimplePost && postTags.length', async () => {
      beforeEach(async () => {
        metadata = {
          wobj: {
            wobjects: [
              { author_permlink: mockObject.author_permlink, percent: 100 },
              { author_permlink: faker.random.string(10), percent: 0 },
            ],
          },
          tags: [mockHashtag.author_permlink, mockHashtag2.author_permlink],
        };
      });
      it('should be deep eq to mocks tags should add with percent 0', async () => {
        const mocks = [{
          author_permlink: mockObject.author_permlink,
          percent: 100,
        },
        {
          author_permlink: metadata.wobj.wobjects[1].author_permlink,
          percent: 0,
        },
        {
          author_permlink: mockHashtag.author_permlink,
          percent: 0,
        },
        {
          author_permlink: mockHashtag2.author_permlink,
          percent: 0,
        }];
        wobjects = await postHelper.parseBodyWobjects(metadata);
        expect(wobjects).to.be.deep.eq(mocks);
      });
    });
    describe('case we have links in body on waivio wobj', async () => {
      let bodyWobject, body;
      beforeEach(async () => {
        bodyWobject = await ObjectFactory.Create();
        metadata = {
          wobj: {
            wobjects: [
              { author_permlink: mockObject.author_permlink, percent: 100 },
              { author_permlink: faker.random.string(10), percent: 0 },
            ],
          },
          tags: [mockHashtag.author_permlink],
        };
        body = `${faker.random.string()}https://waivio.com/object/${bodyWobject.author_permlink}${_.sample(['/', ' ', ':', ',', '.', ';', ')', '?'])}${faker.random.string()}`;
      });
      it('should deep eq object when metadata has wobjects and tags', async () => {
        const mocks = [{
          author_permlink: mockObject.author_permlink,
          percent: 50,
        },
        {
          author_permlink: metadata.wobj.wobjects[1].author_permlink,
          percent: 0,
        },
        {
          author_permlink: bodyWobject.author_permlink,
          percent: 50,
        },
        {
          author_permlink: mockHashtag.author_permlink,
          percent: 0,
        }];
        wobjects = await postHelper.parseBodyWobjects(metadata, body);
        expect(wobjects).to.be.deep.eq(mocks);
      });
      it('should deep eq object when metadata has wobjects', async () => {
        metadata = _.omit(metadata, ['tags']);
        const mocks = [{
          author_permlink: mockObject.author_permlink,
          percent: 50,
        },
        {
          author_permlink: metadata.wobj.wobjects[1].author_permlink,
          percent: 0,
        },
        {
          author_permlink: bodyWobject.author_permlink,
          percent: 50,
        }];
        wobjects = await postHelper.parseBodyWobjects(metadata, body);
        expect(wobjects).to.be.deep.eq(mocks);
      });
      it('should deep eq object when metadata has tags', async () => {
        metadata = _.omit(metadata, ['wobj']);
        const mocks = [{
          author_permlink: bodyWobject.author_permlink,
          percent: 100,
        }, {
          author_permlink: mockHashtag.author_permlink,
          percent: 0,
        }];
        wobjects = await postHelper.parseBodyWobjects(metadata, body);
        expect(wobjects).to.be.deep.eq(mocks);
      });
      it('should deep eq object when no metadata', async () => {
        metadata = _.omit(metadata, ['tags']);
        const mocks = [{
          author_permlink: bodyWobject.author_permlink,
          percent: 100,
        }];
        wobjects = await postHelper.parseBodyWobjects({}, body);
        expect(wobjects).to.be.deep.eq(mocks);
      });
    });
  });

  describe('On addToRelated', async () => {
    let mockObject, body, image;
    beforeEach(async () => {
      await dropDatabase();
      body = faker.random.string();
      mockObject = await ObjectFactory.Create();
      await RelatedFactory.Create({ id: mockObject.author_permlink, body });
    });
    it('should not add to collection, if record already exists', async () => {
      await postHelper.addToRelated([mockObject], [body]);
      image = await RelatedAlbum.find({}).lean();
      expect(image).to.has.length(1);
    });
    it('should add to collection, if record does not exists', async () => {
      await postHelper.addToRelated([mockObject], [faker.random.string()]);
      image = await RelatedAlbum.find({}).lean();
      expect(image).to.has.length(2);
    });
  });
});
