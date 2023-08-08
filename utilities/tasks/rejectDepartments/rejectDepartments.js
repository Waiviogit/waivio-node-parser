const { WObject } = require('database').models;

const rejectDepartments = async () => {
  try {
    const objects = WObject.find({ object_type: { $in: ['product', 'book'] } });

    for await (const object of objects) {
      const departmentsToPull = [];
      for (const department of object?.departments ?? []) {
        const field = object?.fields?.find((el) => el.body === department && el.name === 'departments');
        if (field && field.weight < 0) {
          departmentsToPull.push(department);
        }
      }
      if (departmentsToPull.length) {
        console.log(`pull ${departmentsToPull.toString()} for ${object.author_permlink}`);
        await WObject
          .updateOne({ _id: object._id }, { $pullAll: { departments: departmentsToPull } });
      }
    }
    console.log('TaskFinished');
  } catch (error) {
    console.log(error);
  }
};

module.exports = rejectDepartments;
