const { App } = require('database').models;

const getOne = async ({ name }) => {
  try {
    const app = await App.findOne({ name }).lean();

    if (!app) return { error: { message: 'App not found!' } };
    return { app };
  } catch (error) {
    return { error };
  }
};

const updateChosenPost = async ({
  name, author, permlink, title, period = 'daily',
}) => {
  try {
    return {
      app: await App.findOneAndUpdate(
        { name },
        { [`${period}_chosen_post`]: { author, permlink, title } },
        { new: true },
      ),
    };
  } catch (error) {
    return { error };
  }
};

/**
 * Find app by moderation options.
 * Find by userName is admin, or
 * if userName is moder for one of wobjects from "author_permlinks"
 * @param userName {String}
 * @returns {Promise<void|Object>}
 */
const findByModeration = async (userName) => {
  try {
    const apps = await App.find({ $or: [{ admins: userName }, { moderators: userName }] }).lean();
    return { apps };
  } catch (error) {
    return { error };
  }
};

const findOne = async (condition) => {
  try {
    return { result: await App.findOne(condition, '+service_bots').lean() };
  } catch (error) {
    return { error };
  }
};

const updateOne = async (condition, updateData) => {
  try {
    return { result: await App.updateOne(condition, updateData) };
  } catch (error) {
    return { error };
  }
};

module.exports = {
  getOne, updateChosenPost, findByModeration, findOne, updateOne,
};
