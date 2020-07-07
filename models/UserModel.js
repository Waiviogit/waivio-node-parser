const _ = require('lodash');
const moment = require('moment');
const UserModel = require('database').models.User;
const UserWobjectsModel = require('database').models.UserWobjects;


const create = async (data) => {
  const newUser = new UserModel(data);

  try {
    return { user: await newUser.save() };
  } catch (error) {
    return { error };
  }
};

const addObjectFollow = async (data) => {
  try {
    const res = await UserModel.findOneAndUpdate(
      { name: data.user }, // condition
      { $addToSet: { objects_follow: data.author_permlink } }, // update
      { new: true },
    );

    if (!res) {
      return { result: false };
    }
    return { result: true };
  } catch (error) {
    return { error };
  }
};

const removeObjectFollow = async (data) => {
  try {
    const res = await UserModel.findOneAndUpdate(
      { name: data.user }, // conditions
      { $pull: { objects_follow: data.author_permlink } }, // update data
      { new: true },
    );
    if (!res) {
      return { result: false };
    }
    return { result: true };
  } catch (error) {
    return { error };
  }
};

const addUserFollow = async ({ follower, following, isUnfollow = false }) => {
  if (!_.isString(follower) || !_.isString(following)) {
    return { error: 'follower and following must be a string!' };
  }
  try {
    // update Following user, if those user exist => method return {n: 1} else {n:0} etc.
    const followingUpdResult = await UserModel.updateOne(
      { name: following },
      { $inc: { followers_count: isUnfollow ? -1 : 1 } },
    );
    if (!_.get(followingUpdResult, 'n')) return { result: false };

    return { result: true };
  } catch (error) {
    return { error };
  }
};

const removeUserFollow = async ({ follower, following }) => addUserFollow({
  following,
  follower,
  isUnfollow: true,
});

/**
 * Return user if it exist, or create new user and return
 * @param name {String}
 * @returns {Promise<{user: *}|{error: *}>}
 */
const checkAndCreate = async (name) => {
  if (!_.isString(name)) {
    return { error: 'Name must be a string!' };
  }
  try {
    let user = await UserModel.findOne({ name }).select('+user_metadata').lean();
    if (user) return { user };

    user = await UserModel.create({ name });
    console.log(`User ${name} created!`);
    return { user: user.toObject() };
  } catch (error) {
    return { error };
  }
};

/**
 * Update user_wobjects docs
 * @param data {Object} includes name, author_permlink and weight
 * @returns {Promise<{result: boolean}|{error: *}>}
 */
const increaseWobjectWeight = async (data) => {
  try {
    // add weight in wobject to user
    await UserWobjectsModel.updateOne(
      {
        user_name: data.name,
        author_permlink: data.author_permlink,
      },
      { $inc: { weight: data.weight } },
      { upsert: true, setDefaultsOnInsert: true },
    );
    await increaseUserWobjectsWeight({ name: data.name, weight: data.weight });
    return { result: true };
  } catch (error) {
    return { error };
  }
};

/**
 * Update Waivio weight of user in Users collection
 * @param data {Object} includes name and weight
 * @returns {Promise<{result: boolean}|{error: *}>}
 */
const increaseUserWobjectsWeight = async (data) => {
  try {
    await UserModel.updateOne({
      name: data.name,
    }, {
      $inc: {
        wobjects_weight: data.weight,
      },
    });
    return { result: true };
  } catch (error) {
    return { error };
  }
};

// object shares - user weight in specified wobject
const checkForObjectShares = async (data) => {
  try {
    const userWobject = await UserWobjectsModel.findOne({
      user_name: data.name,
      author_permlink: data.author_permlink,
    }).lean();

    if (!userWobject) {
      return { error: { message: 'User have no weight in current object!' } };
    }
    return { weight: userWobject.weight };
  } catch (error) {
    return { error };
  }
};

const update = async (condition, updateData) => {
  try {
    return { result: await UserModel.updateMany(condition, updateData) };
  } catch (error) {
    return { error };
  }
};

const updateOne = async (condition, updateData) => {
  try {
    return { result: await UserModel.updateOne(condition, updateData) };
  } catch (error) {
    return { error };
  }
};

const updateOnNewPost = async (author, postCreatedTime) => {
  try {
    const result = await UserModel.updateOne(
      { name: author },
      {
        $inc: { count_posts: 1, last_posts_count: 1 },
        $set: { last_root_post: moment.utc(postCreatedTime).toISOString().split('.')[0] },
      },
    );
    return { result: result.nModified === 1 };
  } catch (error) {
    return { error };
  }
};

const findOne = async (name) => {
  try {
    return { user: await UserModel.findOne({ name }).lean() };
  } catch (error) {
    return { error };
  }
};

module.exports = {
  create,
  addObjectFollow,
  removeObjectFollow,
  addUserFollow,
  removeUserFollow,
  checkAndCreate,
  increaseWobjectWeight,
  checkForObjectShares,
  update,
  updateOne,
  updateOnNewPost,
  findOne,
};
