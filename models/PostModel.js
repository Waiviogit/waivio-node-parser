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
    return { post: await PostModel.findOne({ ...cond }).lean() };
  } catch (error) {
    return { error };
  }
};

const update = async (data, extraOptions = {}) => {
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
        ...extraOptions,
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

const findByBothAuthors = async ({ author, permlink, select = {} }) => {
  try {
    return {
      post: await PostModel.findOne(
        { $or: [{ author, permlink }, { root_author: author, permlink }] },
        select,
      ).lean(),
    };
  } catch (error) {
    return { error };
  }
};

const updateMany = async (conditions, updateData) => {
  try {
    return {
      post: await PostModel.updateMany(conditions, updateData),
    };
  } catch (error) {
    return { error };
  }
};

const getManyPosts = async (postsRefs) => {
  try {
    return { posts: await PostModel.find({ $or: [...postsRefs] }).lean() };
  } catch (error) {
    return { error };
  }
};

const getPostsByVotes = async (votesOps) => {
  const query = _.chain(votesOps)
    .filter((v) => !!v.type)
    .uniqWith((x, y) => x.author === y.author && x.permlink === y.permlink)
    .map((v) => ({ author: v.guest_author || v.author, permlink: v.permlink }))
    .value();
  if (_.isEmpty(query)) return [];

  const { posts = [] } = await getManyPosts(query);

  return posts;
};

const setWobjectsToPost = async (data) => {
  try {
    const result = await PostModel.updateOne(
      {
        root_author: data.author,
        permlink: data.permlink,
      },
      { $set: { wobjects: data.wobjects } },
    );

    return { result };
  } catch (error) {
    return { error };
  }
};

const removeWobjectsFromPost = async ({ author, permlink, authorPermlinks }) => {
  try {
    const result = await PostModel.updateOne(
      { root_author: author, permlink },
      { $pull: { wobjects: { author_permlink: { $in: authorPermlinks } } } },
    );
    return { result: result.nModified };
  } catch (error) {
    return { error };
  }
};

const updateOne = async (filter, updateData, options) => {
  try {
    return { result: await PostModel.updateOne(filter, updateData, options) };
  } catch (error) {
    return { error };
  }
};

const findOneAndDelete = async (filter, options) => {
  try {
    return { result: await PostModel.findOneAndDelete(filter, options).lean() };
  } catch (error) {
    return { error };
  }
};

const find = async ({ filter, projection, options }) => {
  try {
    return { result: await PostModel.find(filter, projection, options).lean() };
  } catch (error) {
    return { error };
  }
};

module.exports = {
  removeWobjectsFromPost,
  getPostsByVotes,
  setWobjectsToPost,
  findByBothAuthors,
  findOneAndDelete,
  getPostsRefs,
  getManyPosts,
  updateMany,
  updateOne,
  findOne,
  create,
  update,
  find,
};
