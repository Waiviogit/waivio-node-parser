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
 * @param authorPermlinks* {Array<String>}
 * @returns {Promise<void|Object>}
 */
const findByModeration = async (userName, authorPermlinks) => {
  try {
    const condition = { $or: [{ admins: userName }] };
    if (authorPermlinks || Array.isArray(authorPermlinks)) {
      condition.$or.push({
        'moderators.name': userName,
        'moderators.author_permlinks': { $in: [...authorPermlinks] },
      });
    }
    const apps = await App.find(condition).lean();
    return { apps };
  } catch (error) {
    return { error };
  }
};

module.exports = { getOne, updateChosenPost, findByModeration };
