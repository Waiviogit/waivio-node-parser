const { RelatedAlbum } = require('database').models;

exports.addImageToRelated = async ({ authorPermlink, body }) => {
  const newImage = new RelatedAlbum({ authorPermlink, body });
  try {
    await newImage.save();
    return { result: true };
  } catch (error) {
    return { error };
  }
};

exports.findOne = async (condition, select) => {
  try {
    return { image: await RelatedAlbum.findOne(condition, select).lean() };
  } catch (error) {
    return { error };
  }
};
