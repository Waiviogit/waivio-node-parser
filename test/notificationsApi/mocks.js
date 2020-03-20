const { faker, WobjModel } = require('test/testHelper');
const { ObjectFactory, userWobjectFactory } = require('test/factories');


exports.restaurantMock = async ({
  objectName, status, expert, voter,
} = {}) => {
  objectName = objectName || faker.random.string();
  expert = expert || faker.name.firstName();
  const appends = [
    {
      name: 'name',
      body: objectName,
      weight: faker.random.number(),
    },
  ];
  const restaurant = await ObjectFactory.Create({ appends });
  if (status) {
    await WobjModel.update(
      { author_permlink: restaurant.author_permlink }, { status: { title: status } },
    );
  }
  await userWobjectFactory.Create(
    { author_permlink: restaurant.author_permlink, user_name: expert },
  );

  const data = {
    body: `{title:${status}`,
    creator: faker.name.firstName(),
    object_name: objectName,
    experts: [expert],
    author_permlink: restaurant.author_permlink,
  };
  voter ? data.voter = voter : null;
  return { restaurant, data };
};
