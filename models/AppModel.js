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

module.exports = { getOne, updateChosenPost };
