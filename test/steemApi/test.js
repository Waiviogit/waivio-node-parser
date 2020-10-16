const { expect, postsUtil } = require('../testHelper');

const TEST_POST_ON_STEEMIT = { author: 'waiviodev', permlink: 'yqsgzu78um7' };

describe('Steem API', async () => {
  describe('Posts Util', async () => {
    describe('on existing post', async () => {
      let result;
      before(async () => {
        result = await postsUtil.getPost(TEST_POST_ON_STEEMIT.author, TEST_POST_ON_STEEMIT.permlink);
      });
      it('should return post', () => {
        expect(result).to.has.key('post');
      });
      it('should return correct post with args', () => {
        expect(result.post).to.include.keys(['author', 'permlink', 'title', 'body', 'json_metadata']);
      });
      it('should not return error', () => {
        expect(result).to.not.has.key('error');
      });
    });

    describe('on non existing post', async () => {
      let result;
      before(async () => {
        result = await postsUtil.getPost('kkkkkkkkk', 'kkkkkkkkk');
      });
      it('should return error', () => {
        expect(result).to.has.key('error');
      });
    });
  });
});
