const { Subscriptions } = require('database').models;

const followUser = async ({ follower, following }) => {
  const newSubscribe = new Subscriptions({
    follower,
    following,
  });

  try {
    await newSubscribe.save();
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

const getFollowers = async ({ following }) => {
  try {
    const result = await Subscriptions.find({ following }).select('follower').lean();
    return { users: result.map((el) => el.follower) };
  } catch (error) {
    return { error };
  }
};

const getFollowings = async ({ follower }) => {
  try {
    const result = await Subscriptions.find({ follower }).select('following').lean();
    return { users: result.map((el) => el.following) };
  } catch (error) {
    return { error };
  }
};


module.exports = {
  followUser,
  unfollowUser,
  getFollowers,
  getFollowings,
};
