const { faker, WObject, commentRefSetter } = require('test/testHelper');
const ObjectFactory = require('test/factories/Object/ObjectFactory');

const Create = async ({
  creator, name, weight, body, number, root_wobj, additionalFields = {}, activeVotes, object_type,
} = {}) => {
  const appendObject = {
    name: name || 'city',
    body: body || faker.address.city(),
    locale: 'en-US',
    weight: weight || faker.random.number(1000),
    creator: creator || faker.name.firstName().toLowerCase(),
    author: faker.name.firstName().toLowerCase(),
    permlink: faker.random.string(20),
    active_votes: activeVotes || [],
    number: number || faker.random.string(10),
  };
  for (const key in additionalFields) appendObject[key] = additionalFields[key];

  root_wobj = root_wobj || `${faker.random.string(3)}-${faker.address.city().replace(/ /g, '')}`;
  let wobject = await WObject.findOne({ author_permlink: root_wobj });

  if (!wobject) {
    wobject = await ObjectFactory.Create({ author_permlink: root_wobj, fields: [appendObject], object_type });
  }
  await WObject.updateOne({ author_permlink: root_wobj }, { $addToSet: { fields: appendObject } });
  await commentRefSetter.addAppendWobj(
    `${appendObject.author}_${appendObject.permlink}`,
    root_wobj || faker.random.string(20),
  );
  return { appendObject, root_wobj, wobject };
};

module.exports = { Create };
