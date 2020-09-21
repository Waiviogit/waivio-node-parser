const { WobjectSubscriptions } = require('database').models;

const followWobject = async ({ follower, following }) => {
  const newSubscribe = new WobjectSubscriptions({
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

const unfollowWobject = async ({ follower, following }) => {
  try {
    const result = await WobjectSubscriptions.deleteOne({ follower, following });
    if (!result || !result.n) {
      return { result: false };
    }
    return { result: true };
  } catch (error) {
    return { error };
  }
};

const findOne = async ({ follower, following }) => {
  try {
    return { user: await WobjectSubscriptions.findOne({ follower, following }).lean() };
  } catch (error) {
    return { error };
  }
};

const updateOne = async ({ follower, following, bell }) => {
  try {
    return { result: await WobjectSubscriptions.updateOne({ follower, following }, { bell }) };
  } catch (error) {
    return { error };
  }
};

module.exports = {
  followWobject, unfollowWobject, findOne, updateOne,
};
