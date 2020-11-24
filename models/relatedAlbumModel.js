const { RelatedAlbum } = require('database').models;

exports.update = async (data) => {
  try {
    const result = await RelatedAlbum.findOneAndUpdate({
      wobjAuthorPermlink: data.wobjAuthorPermlink,
      postAuthorPermlink: data.postAuthorPermlink,
    },
    data,
    { upsert: true, new: true });

    return { result };
  } catch (error) {
    return { error };
  }
};
exports.findOne = async (condition, select = {}) => {
  try {
    return { result: await RelatedAlbum.findOne(condition, select).lean() };
  } catch (error) {
    return { error };
  }
};

exports.deleteOne = async (condition) => {
  try {
    return { result: await RelatedAlbum.deleteOne(condition) };
  } catch (error) {
    return { error };
  }
};
