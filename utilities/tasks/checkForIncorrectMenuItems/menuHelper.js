const { WObject } = require('database').models;
const _ = require('lodash');


const runTask = async () => {
  const result = await WObject.find({ object_type: 'restaurant', 'fields.type': 'menuList' }).lean();
  for (const rest of result) {
    const menuField = _.find(rest.fields, (field) => field.type === 'menuList');
    const menu = await WObject.findOne({ author_permlink: menuField.body }).lean();
    if (menu && menu.fields && menu.fields.length) {
      for (const field of menu.fields) {
        if (field.name === 'listItem') {
          const dish = await WObject.findOne({ author_permlink: field.body }).lean();
          if (dish && dish.object_type === 'dish') {
            if (dish && dish.parent !== rest.author_permlink) {
              const newFields = _.filter(menu.fields, (fiel) => fiel.permlink !== field.permlink);
              await WObject.updateOne(
                { author_permlink: menuField.body }, { fields: newFields },
              );
              console.log(`dish: ${dish.author_permlink}, restaurant: ${rest.author_permlink}`);
            }
          } else if (dish && dish.object_type === 'list') {
            for (const field2 of dish.fields) {
              if (field2.name === 'listItem') {
                const Dish = await WObject.findOne({ author_permlink: field.body }).lean();
                if (Dish && Dish.object_type === 'dish') {
                  if (Dish && Dish.parent !== rest.author_permlink) {
                    const newFields = _.filter(menu.fields, (fiel) => fiel.permlink !== field.permlink);
                    await WObject.updateOne(
                      { author_permlink: menuField.body }, { $set: { fields: newFields } },
                    );
                    console.log(`dish: ${Dish.author_permlink}, restaurant: ${rest.author_permlink}`);
                  }
                }
              }
            }
          }
        }
      }
    }
  }
};

module.exports = { runTask };
