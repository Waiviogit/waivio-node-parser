const { WObject, Department } = require('database').models;

module.exports = async () => {
  try {
    const objects = await WObject.find({
      $and: [
        { departments: { $exists: true } },
        { departments: { $ne: [] } },
      ],
    }).lean();

    for (const object of objects) {
      await Department.updateMany({
        name: { $in: object.departments },
      },
      {
        $addToSet: { related: { $each: object.departments } },
      });
    }
  } catch (error) {
    console.error(error.message);
  }
};
