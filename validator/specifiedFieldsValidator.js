const _ = require('lodash');

const validateMap = (map) => {
  if (_.isNil(map)) {
    return false;
  } if (!map.longitude || typeof map.longitude !== 'number' || map.longitude < -180 || map.longitude > 180) {
    return false;
  } if (!map.latitude || typeof map.latitude !== 'number' || map.latitude < -90 || map.latitude > 90) {
    return false;
  }
  return true;
};

module.exports = { validateMap };
