const { ObjectType } = require('../database').models;

const getAll = async () => {
  try {
    const objectTypes = await ObjectType.find().lean();

    return { objectTypes };
  } catch (e) {
    return { error: e };
  }
};

const getOne = async ({ name }) => {
  try {
    const objectType = await ObjectType.findOne({ name }).lean();

    if (!objectType) {
      return { error: { status: 404, message: 'Object Type not found!' } };
    }
    return { objectType };
  } catch (e) {
    return { error: e };
  }
};

const create = async ({ name, author, permlink }) => {
  const newObjectType = new ObjectType({ name, author, permlink });

  try {
    return { objectType: await newObjectType.save() };
  } catch (error) {
    return { error };
  }
};

module.exports = { getAll, getOne, create };
