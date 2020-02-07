const _ = require('lodash');
const {
  expect, faker, CommentModel, Comment, User,
} = require('../../testHelper');
const { CommentFactory } = require('../../factories');

describe('CommentModel', async () => {
  describe('On create', () => {
    let comment,
      result,
      createdComment;

    beforeEach(async () => {
      comment = await CommentFactory.Create({ onlyData: true });
      result = await CommentModel.createOrUpdate(comment);
      createdComment = await Comment.findOne({ author: comment.author, permlink: comment.permlink }).lean();
    });
    it('should create user - author of comment ', async () => {
      const user = await User.findOne({ name: comment.author }).lean();
      expect(user).is.exist;
    });

    it('should create comment in DB', async () => {
      expect(createdComment).is.exist;
    });
    it('should create comment with correct fields', async () => {
      const keys = 'author,permlink,parent_author,parent_permlink,root_author,root_permlink,active_votes,guestInfo,_id'.split(',');
      expect(createdComment).to.has.all.keys(keys);
    });
    it('should create comment with correct format', () => {
      expect(_.omit(createdComment, '_id')).to.deep.eq(comment);
    });
    it('should return created comment', () => {
      expect(result.comment).is.exist;
    });
    it('should create comment only with allowed fields(without redundant)', async () => {
      comment = await CommentFactory.Create({ onlyData: true });
      comment = { ...comment, id: faker.random.number(1000), redundantField2: faker.random.string() };
      result = await CommentModel.createOrUpdate(comment);
      createdComment = await Comment.findOne({ author: comment.author, permlink: comment.permlink }).lean();
      expect(createdComment).to.has.not.any.keys(['id', 'redundantField2']);
    });
    it('should update if comment was exist)', async () => {
      comment = await CommentFactory.Create();
      comment = {
        ...comment,
        active_votes: [{
          voter: faker.name.firstName().toLowerCase(),
          percent: faker.random.number(10000),
        }],
      };
      result = await CommentModel.createOrUpdate(comment);
      createdComment = await Comment.findOne({ author: comment.author, permlink: comment.permlink }).lean();
      expect(createdComment.active_votes.map((v) => _.omit(v, '_id')))
        .to.be.deep.eq(comment.active_votes);
    });
    it('should not update active_votes if key not exist in update data', async () => {
      comment = await CommentFactory.Create({
        active_votes: [{
          voter: faker.name.firstName().toLowerCase(),
          percent: faker.random.number(10000),
        }],
      });
      delete comment.active_votes;
      result = await CommentModel.createOrUpdate(comment);
      const updatedComment = await Comment.findOne({ author: comment.author, permlink: comment.permlink }).lean();
      expect(updatedComment.active_votes).to.not.been.empty;
    });
  });
  describe('On addVote', async () => {
    let comment,
      mockVote,
      result,
      updatedComment;

    beforeEach(async () => {
      mockVote = { voter: faker.name.firstName().toLowerCase(), percent: faker.random.number(10000) };
      comment = await CommentFactory.Create();
      result = await CommentModel.addVote({ ..._.pick(comment, ['author', 'permlink']), ...mockVote });

      updatedComment = await Comment.findOne({ ..._.pick(comment, ['author', 'permlink']) }).lean();
    });
    it('should increase votes count', async () => {
      expect(updatedComment.active_votes).to.has.length(1);
    });
    it('should add correct vote to active_votes', () => {
      expect(updatedComment.active_votes.find((v) => v.voter === mockVote.voter && v.percent === mockVote.percent)).is.exist;
    });
    it('should not add duplicates of votes', async () => {
      await CommentModel.addVote({ ..._.pick(comment, ['author', 'permlink']), ...mockVote });
      updatedComment = await Comment.findOne({ ..._.pick(comment, ['author', 'permlink']) }).lean();
      expect(updatedComment.active_votes).to.has.length(1);
    });
    it('should return n:1 on success', () => {
      expect(result.result).to.deep.eq({ n: 1, nModified: 1, ok: 1 });
    });
  });
});
