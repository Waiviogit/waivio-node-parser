const { RelatedAlbum, faker } = require('test/testHelper');

const Create = async ({
  id, body, onlyData,
} = {}) => {
  const imageData = {
    id: id || faker.name.firstName(),
    body: body || faker.name.firstName(),
  };
  if (onlyData) return imageData;
  const image = new RelatedAlbum(imageData);
  await image.save();
  image.toObject();

  return image;
};

module.exports = { Create };
