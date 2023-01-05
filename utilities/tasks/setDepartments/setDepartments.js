const { WObject, Department } = require('database').models;
const _ = require('lodash');

module.exports = async () => {
  try {
    const departments = await Department.find().lean();

    for (const department of departments) {
      const objects = await WObject.find(
        { departments: department.name },
        { departments: 1 },
      ).lean();
      if (_.isEmpty(objects)) continue;

      const related = _.reduce(objects, (acc, el) => {
        acc.push(...el.departments);
        return acc;
      }, []);
      const unique = _.uniq(related);

      await Department.updateOne(
        {
          name: department.name,
        }, {
          objectsCount: objects.length,
          $addToSet: { related: { $each: unique } },
        },
      );
    }
  } catch (e) {
    console.error(e.message);
  }
};
