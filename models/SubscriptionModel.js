const { Subscriptions } = require('database').models;

const followUser = async ({ follower, following }) => {
  const newSubscribe = new Subscriptions({
    follower,
    following,
  });

  try {
    const result = await newSubscribe.save();
    if (!result) {
      return { result: false };
    }
    return { result: true };
  } catch (error) {
    return { error };
  }
};

const unfollowUser = async ({ follower, following }) => {
  try {
    const result = await Subscriptions.deleteOne({ follower, following });
    if (!result || !result.n) {
      return { result: false };
    }
    return { result: true };
  } catch (error) {
    return { error };
  }
};

module.exports = {
  followUser,
  unfollowUser,
};
