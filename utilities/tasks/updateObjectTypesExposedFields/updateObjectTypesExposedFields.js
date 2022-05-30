const { ObjectType } = require('database').models;

exports.updateObjectTypes = async (updateObjectTypes, fieldName) => {
  try {
    await ObjectType.updateMany({ name: { $in: updateObjectTypes.split(',') } },
      { $addToSet: { exposedFields: fieldName } });
    console.log('task completed');
  } catch (error) {
    console.log('Saving error', error);
    console.log('task completed');
  }
};
