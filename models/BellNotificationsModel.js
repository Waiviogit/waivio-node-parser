const { BellNotifications } = require('database').models;

const followUserNotifications = async ({ follower, following }) => {
  const newSubscribe = new BellNotifications({
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

const unFollowUserNotifications = async ({ follower, following }) => {
  try {
    const result = await BellNotifications.deleteOne({ follower, following });
    if (!result || !result.n) {
      return { result: false };
    }
    return { result: true };
  } catch (error) {
    return { error };
  }
};

module.exports = {
  followUserNotifications,
  unFollowUserNotifications,
};
