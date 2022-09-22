const { DatafinityObject } = require('database').models.DatafinityObject;

const getOne = async (filter) => {
  try {
    const datafinityObject = await DatafinityObject.findOne(filter).lean();

    return { datafinityObject };
  } catch (error) {
    return { error };
  }
};

module.exports = { getOne };
