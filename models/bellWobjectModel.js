const { BellWobject } = require('database').models;

const followWobjectNotifications = async ({ follower, following }) => {
  const newSubscribe = new BellWobject({
    follower,
    following,
  });

  try {
    await newSubscribe.save();
    return true;
  } catch (error) {
    return { error };
  }
};

const unFollowWobjectNotifications = async ({ follower, following }) => {
  try {
    const result = await BellWobject.deleteOne({ follower, following });
    return !!result.n;
  } catch (error) {
    return { error };
  }
};

module.exports = {
  followWobjectNotifications,
  unFollowWobjectNotifications,
};
