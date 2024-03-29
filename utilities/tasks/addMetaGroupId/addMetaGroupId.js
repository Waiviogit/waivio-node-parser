const { WObject } = require('database').models;
const { FIELDS_NAMES, OBJECT_TYPES } = require('constants/wobjectsData');
const crypto = require('node:crypto');
const _ = require('lodash');

const findNotProcessedObject = async () => {
  try {
    return {
      result: await WObject.findOne(
        {
          fields: {
            $elemMatch: {
              name: FIELDS_NAMES.GROUP_ID,
            },
          },
          object_type: { $in: [OBJECT_TYPES.PRODUCT, OBJECT_TYPES.BOOK] },
          metaGroupId: { $exists: false },
        },
        {
          fields: 1,
        },
      ).lean(),
    };
  } catch (error) {
    return { error };
  }
};

const findByGroupIds = async (groupIds) => {
  try {
    return {
      result: await WObject.find(
        {
          fields: {
            $elemMatch: {
              name: FIELDS_NAMES.GROUP_ID,
              body: { $in: groupIds },
            },
          },
          object_type: {
            $in: [
              OBJECT_TYPES.PRODUCT,
              OBJECT_TYPES.BOOK,
              OBJECT_TYPES.SERVICE,
            ],
          },
          metaGroupId: { $exists: false },
        },
        {
          fields: 1,
        },
      ).lean(),
    };
  } catch (error) {
    return { error };
  }
};

const updateMetaGroupId = async ({ metaGroupId, _id }) => {
  try {
    return {
      result: await WObject.updateOne(
        {
          _id,
        },
        {
          metaGroupId,
        },
      ),
    };
  } catch (error) {
    return { error };
  }
};

const getObjectGroupIds = (wobject) => _.chain(wobject.fields)
  .filter((f) => f.name === FIELDS_NAMES.GROUP_ID)
  .map((el) => el.body)
  .value();

const addToAllMetaGroup = async ({ groupIds, metaGroupId }) => {
  while (true) {
    const { result, error } = await findByGroupIds(groupIds);
    if (error) break;
    if (_.isEmpty(result)) break;
    for (const resultElement of result) {
      groupIds = _.uniq([...groupIds, ...getObjectGroupIds(resultElement)]);
      await updateMetaGroupId({ metaGroupId, _id: resultElement._id });
    }
  }
};

const addMetaGroupIdToAllProductsAndBooks = async () => {
  try {
    const objects = await WObject.find(
      {
        metaGroupId: { $exists: false },
        object_type: {
          $in: [
            OBJECT_TYPES.PRODUCT,
            OBJECT_TYPES.BOOK,
            OBJECT_TYPES.SERVICE,
          ],
        },
      },
      {
        _id: 1,
      },
    ).lean();

    for (const object of objects) {
      const metaGroupId = crypto.randomUUID();
      await updateMetaGroupId({ metaGroupId, _id: object._id });
    }
  } catch (error) {
    console.error(error.message);
  }
};

const addMetaGroupId = async () => {
  while (true) {
    const { result: wobject, error } = await findNotProcessedObject();
    if (error) break;
    if (!wobject) break;
    const metaGroupId = crypto.randomUUID();
    await updateMetaGroupId({ metaGroupId, _id: wobject._id });

    const groupIds = getObjectGroupIds(wobject);
    await addToAllMetaGroup({ groupIds, metaGroupId });
  }
  await addMetaGroupIdToAllProductsAndBooks();

  console.log('taskFinished');
};

module.exports = addMetaGroupId;
