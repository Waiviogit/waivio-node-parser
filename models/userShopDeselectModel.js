const { UserShopDeselect } = require('database').models;

const create = async ({ userName, authorPermlink }) => {
  try {
    const result = await UserShopDeselect.create({ userName, authorPermlink });

    return { result };
  } catch (error) {
    return { error };
  }
};

const deleteOne = async ({ userName, authorPermlink }) => {
  try {
    const result = await UserShopDeselect.deleteOne({ userName, authorPermlink });
    return { result };
  } catch (error) {
    return { error };
  }
};

module.exports = {
  create, deleteOne,
};
