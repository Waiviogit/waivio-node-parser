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
