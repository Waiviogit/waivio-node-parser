const { OBJECT_TYPES } = require('constants/wobjectsData');
const _ = require('lodash');
const {
  postByTagsHelper, importTags, expect, sinon, WobjModel, faker,
} = require('test/testHelper');

describe('postByTagsHelper', async () => {
  describe('wobjectsByTags', async () => {
    let importTagsStub;
    describe('if tags exists', async () => {
      const input = [faker.random.string(), faker.random.string(), faker.random.string()];
      let wobjModelStub,
        result;
      beforeEach(async () => {
        wobjModelStub = sinon.stub(WobjModel, 'getOne').callsFake(({ author_permlink, object_type }) => ({ wobject: { author_permlink } }));
        result = await postByTagsHelper.wobjectsByTags(input);
      });
      afterEach(() => {
        wobjModelStub.restore();
      });
      it('should return array of tags', () => {
        expect(result).to.deep.eq(input.map((tag) => (
          {
            author_permlink: tag,
            objectType: OBJECT_TYPES.HASHTAG,
            tagged: tag,
            percent: _.round(100 / input.length, 3),
          }
        )));
      });

      it('should call Wobject model method "getOne" thrice', () => {
        expect(wobjModelStub.calledThrice).to.be.true;
      });
    });
    describe('if tags not exists', async () => {
      const input = [faker.random.string(), faker.random.string(), faker.random.string()];
      let wobjModelStub,
        result;
      beforeEach(async () => {
        wobjModelStub = sinon.stub(WobjModel, 'getOne').callsFake(({ author_permlink, object_type }) => ({}));
        importTagsStub = sinon.stub(importTags, 'send').callsFake(() => {});
        process.env.DYNAMIC_HASHTAGS = 'true';
        result = await postByTagsHelper.wobjectsByTags(input);
      });
      afterEach(() => {
        wobjModelStub.restore();
        importTagsStub.restore();
      });
      it('should return empty array', () => {
        expect(result).to.deep.eq([]);
      });

      it('should call Wobject model method "getOne" thrice', () => {
        expect(wobjModelStub.calledThrice).to.be.true;
      });
      it('should call importTag method "send" once', () => {
        expect(importTagsStub.calledOnce).to.be.true;
      });
      it('should call importTag with correct args', () => {
        const firstCall = importTagsStub.getCall(0).args[0];
        expect(firstCall).to.deep.eq(input);
      });
    });
    describe('if data not valid', async () => {
      describe('on not string input tags', async () => {
        let wobjModelStub,
          result;
        const input_tags = [123, 234, undefined, null, {}, []];
        beforeEach(async () => {
          wobjModelStub = sinon.stub(WobjModel, 'getOne').callsFake(({ author_permlink, object_type }) => ({}));
          importTagsStub = sinon.stub(importTags, 'send').callsFake(() => {});
          process.env.DYNAMIC_HASHTAGS = 'true';
          result = await postByTagsHelper.wobjectsByTags(input_tags);
        });
        afterEach(() => {
          wobjModelStub.restore();
          importTagsStub.restore();
        });
        it('should not call wobj model', () => {
          expect(wobjModelStub.notCalled).to.be.true;
        });
        it('should not call objectImport helper', () => {
          expect(importTagsStub.notCalled).to.be.true;
        });
        it('should return empty array', () => {
          expect(result).to.deep.eq([]);
        });
      });
      describe('on not valid chars in tag', async () => {
        let wobjModelStub,
          result;
        const input_tags = ['123_23', '235,235', '4425!', 'asdf?'];
        beforeEach(async () => {
          wobjModelStub = sinon.stub(WobjModel, 'getOne').callsFake(({ author_permlink, object_type }) => ({}));
          importTagsStub = sinon.stub(importTags, 'send').callsFake(() => {});
          process.env.DYNAMIC_HASHTAGS = 'true';
          result = await postByTagsHelper.wobjectsByTags(input_tags);
        });
        afterEach(() => {
          wobjModelStub.restore();
          importTagsStub.restore();
        });
        it('should not call wobj model', () => {
          expect(wobjModelStub.notCalled).to.be.true;
        });
        it('should not call objectImport helper', () => {
          expect(importTagsStub.notCalled).to.be.true;
        });
        it('should return empty array', () => {
          expect(result).to.deep.eq([]);
        });
      });
    });
  });
});
