const _ = require('lodash');
const {
  postHelper, faker, expect, dropDatabase, RelatedAlbum, sinon, Post,
} = require('test/testHelper');
const { ObjectFactory, RelatedFactory, PostFactory } = require('test/factories');
const { OBJECT_TYPES_WITH_ALBUM, OBJECT_TYPES } = require('constants/wobjectsData');
const { HOSTS_TO_PARSE_LINKS } = require('constants/regExp');

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
          object_type: OBJECT_TYPES.HASHTAG,
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
          object_type: OBJECT_TYPES.HASHTAG,
          percent: 0,
        },
        {
          author_permlink: mockHashtag2.author_permlink,
          object_type: OBJECT_TYPES.HASHTAG,
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
          object_type: bodyWobject.object_type,
          percent: 50,
        },
        {
          author_permlink: mockHashtag.author_permlink,
          object_type: OBJECT_TYPES.HASHTAG,
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
          object_type: bodyWobject.object_type,
          percent: 50,
        }];
        wobjects = await postHelper.parseBodyWobjects(metadata, body);
        expect(wobjects).to.be.deep.eq(mocks);
      });
      it('should deep eq object when metadata has tags', async () => {
        metadata = _.omit(metadata, ['wobj']);
        const mocks = [{
          author_permlink: bodyWobject.author_permlink,
          object_type: bodyWobject.object_type,
          percent: 100,
        }, {
          author_permlink: mockHashtag.author_permlink,
          object_type: OBJECT_TYPES.HASHTAG,
          percent: 0,
        }];
        wobjects = await postHelper.parseBodyWobjects(metadata, body);
        expect(wobjects).to.be.deep.eq(mocks);
      });
      it('should deep eq object when no metadata', async () => {
        metadata = _.omit(metadata, ['tags']);
        const mocks = [{
          author_permlink: bodyWobject.author_permlink,
          object_type: bodyWobject.object_type,
          percent: 100,
        }];
        wobjects = await postHelper.parseBodyWobjects({}, body);
        expect(wobjects).to.be.deep.eq(mocks);
      });
    });
  });

  describe('On addToRelated', async () => {
    let wobjAuthorPermlink, postAuthorPermlink, mockObject, image;
    beforeEach(async () => {
      await dropDatabase();
      wobjAuthorPermlink = faker.random.string();
      postAuthorPermlink = faker.random.string();
      mockObject = await ObjectFactory.Create({
        author_permlink: wobjAuthorPermlink, object_type: _.sample(OBJECT_TYPES_WITH_ALBUM),
      });
    });
    it('should not add to collection, if images are empty', async () => {
      await postHelper.addToRelated([mockObject], [], postAuthorPermlink);
      image = await RelatedAlbum.findOne({ postAuthorPermlink, wobjAuthorPermlink }).lean();
      expect(image).to.not.exist;
    });
    it('should delete exist record if images are empty', async () => {
      await RelatedFactory.Create({ wobjAuthorPermlink, postAuthorPermlink });
      await postHelper.addToRelated([mockObject], [], postAuthorPermlink);
      image = await RelatedAlbum.findOne({ postAuthorPermlink, wobjAuthorPermlink }).lean();
      expect(image).to.not.exist;
    });
    it('should add to collection, if images exists and valid links', async () => {
      await postHelper.addToRelated([mockObject], [`https://${faker.random.string()}`], postAuthorPermlink);
      image = await RelatedAlbum.findOne({ postAuthorPermlink, wobjAuthorPermlink }).lean();
      expect(image).to.exist;
    });
    it('should not add to collection images with not valid links', async () => {
      const notValid = `http://${faker.random.string()}`;
      await postHelper.addToRelated(
        [mockObject],
        [`https://${faker.random.string()}`, notValid],
        postAuthorPermlink,
      );
      image = await RelatedAlbum.findOne({ postAuthorPermlink, wobjAuthorPermlink }).lean();
      expect(image.images).to.not.include(notValid);
    });
    it('should not add to collection when object not have appropriate exposed fields', async () => {
      wobjAuthorPermlink = faker.random.string();
      mockObject = await ObjectFactory.Create({ author_permlink: wobjAuthorPermlink });
      await postHelper.addToRelated([mockObject], [`https://${faker.random.string()}`], postAuthorPermlink);
      image = await RelatedAlbum.findOne({ postAuthorPermlink, wobjAuthorPermlink }).lean();
      expect(image).to.not.exist;
    });
  });

  describe('On parseCommentBodyWobjects', async () => {
    let objectOnPost, objectOnComment, post, link, result, updatedPost;

    beforeEach(async () => {
      objectOnPost = await ObjectFactory.Create();
      objectOnComment = await ObjectFactory.Create();
      post = await PostFactory.Create({
        wobjects: [{ author_permlink: objectOnPost.author_permlink }],
      });
    });

    describe('On Success adding', async () => {
      beforeEach(async () => {
        link = `${_.sample(HOSTS_TO_PARSE_LINKS)}/object/${objectOnComment.author_permlink}`;
        result = await postHelper.parseCommentBodyWobjects({
          body: link, author: post.author, permlink: post.permlink,
        });
        updatedPost = await Post.findOne({
          author: post.author, permlink: post.permlink,
        }).lean();
      });

      it('should parseCommentBodyWobjects return true', async () => {
        expect(result).to.be.eq(true);
      });

      it('should add second wobject to post', async () => {
        expect(updatedPost.wobjects).to.have.length(2);
      });

      it('should add second wobject has proper author_permlink', async () => {
        expect(updatedPost.wobjects[1].author_permlink).to.be.eq(objectOnComment.author_permlink);
      });

      it('should add second wobject has proper object_type', async () => {
        expect(updatedPost.wobjects[1].object_type).to.be.eq(objectOnComment.object_type);
      });
    });

    describe('When adding same object', async () => {
      beforeEach(async () => {
        link = `${_.sample(HOSTS_TO_PARSE_LINKS)}/object/${objectOnPost.author_permlink}`;
        result = await postHelper.parseCommentBodyWobjects({
          body: link, author: post.author, permlink: post.permlink,
        });
        updatedPost = await Post.findOne({
          author: post.author, permlink: post.permlink,
        }).lean();
      });

      it('should parseCommentBodyWobjects return false', async () => {
        expect(result).to.be.eq(false);
      });

      it('should not add new record to wobject', async () => {
        expect(updatedPost.wobjects).to.have.length(1);
      });
    });

    describe('On bad data', async () => {
      it('should return false when not find proper link in body', async () => {
        link = faker.internet.url();
        result = await postHelper.parseCommentBodyWobjects({
          body: link, author: post.author, permlink: post.permlink,
        });

        expect(result).to.be.eq(false);
      });

      it('should return false when not find post', async () => {
        link = `${_.sample(HOSTS_TO_PARSE_LINKS)}/object/${objectOnComment.author_permlink}`;
        result = await postHelper.parseCommentBodyWobjects({
          body: link, author: faker.random.word(), permlink: faker.random.word(),
        });

        expect(result).to.be.eq(false);
      });

      it('should return false when not find wobject', async () => {
        link = `${_.sample(HOSTS_TO_PARSE_LINKS)}/object/${faker.random.word()}`;
        result = await postHelper.parseCommentBodyWobjects({
          body: link, author: post.author, permlink: post.permlink,
        });

        expect(result).to.be.eq(false);
      });
    });
  });
});
