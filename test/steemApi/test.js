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
      const emptyFields = 'author,permlink,category,parent_author,parent_permlink,title,body,json_metadata,url,root_title'.split(',');
      const zeroFields = 'id,depth,children,net_rshares,abs_rshares,vote_rshares,children_abs_rshares,total_vote_weight,reward_weight,author_rewards,net_votes,percent_steem_dollars,author_reputation,body_length'.split(',');
      before(async () => {
        result = await postsUtil.getPost('kkkkkkkkk', 'kkkkkkkkk');
      });
      it('should not return error', () => {
        expect(result).to.not.has.key('error');
      });
      it('should return post', () => {
        expect(result).to.has.key('post');
      });
      emptyFields.forEach((field) => {
        describe(`Field ${field} of post`, () => {
          it('should be empty', () => {
            expect(result.post[field]).to.be.empty;
          });
        });
      });
      zeroFields.forEach((field) => {
        describe(`Field ${field} of post`, () => {
          it('should be zero', () => {
            expect(result.post[field]).to.be.eq(0);
          });
        });
      });
    });
  });
});
