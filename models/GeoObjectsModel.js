const _ = require('lodash');
const GeoObjectModel = require('database').models.GeoObject;

const create = async (data) => {
  try {
    const geoObject = await GeoObjectModel.findOne(
      { name: data.name, province: data.province, type: data.type },
    ).lean();
    if (geoObject) return { result: geoObject };
    const newObject = await new GeoObjectModel(data).save();
    return { result: newObject.toObject() };
  } catch (error) {
    return { error };
  }
};

const updateOne = async (condition, updateData) => {
  try {
    return { result: await GeoObjectModel.updateOne(condition, updateData) };
  } catch (error) {
    return { error };
  }
};

const updateMany = async (conditions, updateData) => {
  try {
    const result = await GeoObjectModel.updateMany(conditions, updateData);
    return { result: result.nModified };
  } catch (error) {
    return { error };
  }
};

const getOne = async ({ condition, select }) => {
  try {
    const result = await GeoObjectModel.findOne(condition).select(select).lean();
    if (!result) {
      return { error: { status: 404, message: 'Geographic object not found!' } };
    }
    return { result };
  } catch (error) {
    return { error };
  }
};

const fromAggregation = async (pipeline) => {
  try {
    const result = await GeoObjectModel.aggregate([...pipeline]);

    if (!result || _.isEmpty(result)) {
      return { error: { status: 404, message: 'Geographic object not found!' } };
    }
    return { result };
  } catch (error) {
    return { error };
  }
};

module.exports = {
  create, updateOne, updateMany, getOne, fromAggregation,
};
