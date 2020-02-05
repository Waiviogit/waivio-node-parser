const { VoteFactory, AppendObject, PostFactory } = require('../../factories');

const voteAppendObjectMocks = async () => {
  const { appendObject, root_wobj } = await AppendObject.Create();
  const { vote } = VoteFactory.Create({ author: appendObject.author, permlink: appendObject.permlink });
  const post = await PostFactory.Create({ onlyData: true });

  post.author = appendObject.author;
  post.permlink = appendObject.permlink;
  post.active_votes = [{ voter: vote.voter, weight: vote.weight, rshares: 10000000 }];

  return {
    vote, post, appendObject, author_permlink: root_wobj,
  };
};

module.exports = { voteAppendObjectMocks };
