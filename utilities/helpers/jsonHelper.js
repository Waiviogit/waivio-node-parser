exports.parseJson = (json, errorType = {}) => {
  try {
    return JSON.parse(json);
  } catch (error) {
    return errorType;
  }
};
