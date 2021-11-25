const _ = require('lodash');
const { faker, sinon } = require('test/testHelper');
const { usersUtil } = require('../testHelper');
const { expect, postsUtil } = require('../testHelper');
const { redisGetter } = require('../../utilities/redis');

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
        expect(result).to.has.key('err');
      });
    });
  });
  describe('User Util', async () => {
    let result, check;
    before(async () => {
      const votes = [];
      for (let i = 0; i < _.random(2, 8); i++) {
        votes.push({
          voter: faker.random.word(),
          author: faker.random.word(),
          permlink: faker.random.word(),

        });
      }
      const removedObj = _.sampleSize(votes, _.random(1, votes.length - 1));
      const stauRes = _.map(removedObj, (el) => `${el.voter}:${el.author}:${el.permlink}`);

      sinon.stub(redisGetter, 'zrevrange').returns(Promise.resolve(stauRes));
      result = await usersUtil.getSortedVotes(votes);
      check = _.without(votes, ...removedObj);
    });
    it('should return sorted votes', () => {
      expect(result).to.deep.eq(check);
    });
  });
});
