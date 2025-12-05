const { WobjectPendingUpdates } = require('database').models;

const getDocumentsCountByAuthorPermlinkId = async ({ authorPermlink, id }) => {
  try {
    const result = await WobjectPendingUpdates.countDocuments({ authorPermlink, id });
    return result;
  } catch (error) {
    return 0;
  }
};

const createDocument = async (data) => {
  try {
    await WobjectPendingUpdates.create(data);
    return true;
  } catch (error) {
    return false;
  }
};

const getDocumentsByAuthorPermlinkId = async ({ authorPermlink, id }) => {
  try {
    return await WobjectPendingUpdates
      .find({ authorPermlink, id })
      .sort({ partNumber: 1 })
      .lean();
  } catch (error) {
    return [];
  }
};

const deleteDocumentsByAuthorPermlinkId = async ({ authorPermlink, id }) => {
  try {
    await WobjectPendingUpdates.deleteMany({ authorPermlink, id });
    return true;
  } catch (error) {
    return false;
  }
};

module.exports = {
  getDocumentsCountByAuthorPermlinkId,
  createDocument,
  getDocumentsByAuthorPermlinkId,
  deleteDocumentsByAuthorPermlinkId,
};
