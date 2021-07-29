const parseGeoLocations = require('utilities/tasks/parseObjectGeoLocation/parseGeoLocations');

(async () => {
  await parseGeoLocations(process.argv[2], process.argv[3]);
  process.exit();
})();
