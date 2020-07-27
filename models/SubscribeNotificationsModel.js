const { SubscribeNotifications } = require('database').models;

const followUserNotifications = async ({ follower, following }) => {
  const newSubscribe = new SubscribeNotifications({
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
    const result = await SubscribeNotifications.deleteOne({ follower, following });
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
