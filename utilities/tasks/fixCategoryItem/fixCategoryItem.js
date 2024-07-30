const { WObject } = require('database').models;

const fixCategoryItem = async () => {
  const objects = WObject.find({ fields: { $elemMatch: { name: 'categoryItem', tagCategory: { $exists: false } } } });

  for await (const object of objects) {
    for (const categoryItem of object.fields) {
      if (categoryItem.name !== 'categoryItem') continue;
      if (categoryItem.tagCategory) continue;
      const tagCategory = object.fields.find((el) => el.id === categoryItem.id && el.name === 'tagCategory');
      if (!tagCategory) continue;
      categoryItem.tagCategory = tagCategory.body;
    }
    await object.save();
  }
  console.log('task finished');
};

module.exports = fixCategoryItem;
