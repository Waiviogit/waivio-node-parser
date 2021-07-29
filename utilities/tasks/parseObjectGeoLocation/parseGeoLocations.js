const fs = require('fs');
const _ = require('lodash');
const readline = require('readline');
const { GeoObjectModel } = require('models');

module.exports = async (path, objectTypes) => {
  const stream = readline.createInterface({
    input: fs.createReadStream(path, { encoding: 'utf8' }),
    crlfDelay: Infinity,
  });

  for await (const line of stream) {
    try {
      const object = JSON.parse(line.replace(/,\s*$/, ''));
      await saveObject(object, objectTypes.split(','));
    } catch (error) {
      console.log('Error parse line:', line);
    }
  }
};

const saveObject = async (object, objectTypes) => {
  if (!_.includes(objectTypes, object.properties.ENGTYPE_3)) return;
  try {
    await GeoObjectModel.create({
      geometry: object.geometry,
      country: object.properties.NAME_0,
      province: object.properties.NAME_1,
      name: object.properties.NAME_3,
      type: object.properties.ENGTYPE_3,
    });
  } catch (error) {
    console.log('Error save object:', object.properties.NAME_3);
  }
};
