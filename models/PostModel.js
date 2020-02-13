const _ = require('lodash');
const PostModel = require('database').models.Post;
const userHelper = require('utilities/helpers/userHelper');

const create = async (data) => {
  await userHelper.checkAndCreateUser(data.author); // create user in DB if it doesn't exist

  const newPost = new PostModel(data);

  try {
    return { post: await newPost.save() };
  } catch (error) {
    return { error };
  }
};

const findOne = async (data) => {
  try {
    const cond = _.pick(data, [data.root_author ? 'root_author' : 'author', 'permlink']);
    const post = await PostModel.findOne({ ...cond }).lean();
    return { post };
  } catch (error) {
    return { error };
  }
};


const update = async (data) => {
  try {
    const result = await PostModel.findOneAndUpdate(
      {
        author: data.author,
        permlink: data.permlink,
      },
      data,
      {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true,
      },
    );

    return { result };
  } catch (error) {
    return { error };
  }
};

const getPostsRefs = async () => {
  try {
    return {
      posts: await PostModel.aggregate([{
        $project: {
          _id: 0,
          author: 1,
          permlink: 1,
          wobjects: 1,
        },
      }]),
    };
  } catch (error) {
    return { error };
  }
};


const findByBothAuthors = async ({ author, permlink }) => {
  try {
    return {
      result: await PostModel.find({
        $or: [{ author, permlink }, { root_author: author, permlink }],
      }).lean(),
    };
  } catch (error) {
    return { error };
  }
};


module.exports = {
  create, update, findOne, getPostsRefs, findByBothAuthors,
};
