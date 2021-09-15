/* eslint-disable camelcase */
const { WObject, faker, commentRefSetter } = require('test/testHelper');
const ObjectTypeFactory = require('test/factories/ObjectType/ObjectTypeFactory');

const Create = async ({
  onlyData, appends = [], author_permlink: root_permlink, object_type, objName, objParent,
  searchWords,
} = {}) => {
  const parent = objParent || '';
  const created_object_type = await ObjectTypeFactory.Create({ name: object_type });
  const default_name = objName || faker.address.city().toLowerCase();
  const is_posting_open = true;
  const is_extending_open = true;
  const creator = faker.name.firstName().toLowerCase();
  const author = faker.name.firstName().toLowerCase();
  const author_permlink = root_permlink || `${faker.random.string(3)}-${default_name.replace(/ /g, '')}`;
  object_type = created_object_type.name;

  if (onlyData) {
    return {
      parent,
      author_permlink,
      author,
      creator,
      is_extending_open,
      is_posting_open,
      object_type,
      default_name,
    };
  }
  const wobject = await WObject.create({
    parent,
    author_permlink,
    author,
    creator,
    is_extending_open,
    is_posting_open,
    object_type,
    default_name,
    fields: [...appends],
    search: searchWords || {},
  });

  await commentRefSetter.addWobjRef(`${author}_${author_permlink}`, author_permlink);
  return wobject._doc;
};

module.exports = { Create };
