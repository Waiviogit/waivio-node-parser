const { Department } = require('database').models;
const { parseName } = require('utilities/helpers/updateSpecificFieldsHelper');
const _ = require('lodash');

const TopLvlDepartments = [
  {
    name: 'Electronics',
    sortScore: 10,
    level: 1,
  },
  {
    name: 'Computers',
    sortScore: 20,
    level: 1,
  },
  {
    name: 'Smart Home',
    sortScore: 30,
    level: 1,
  },
  {
    name: 'Arts & Crafts',
    sortScore: 40,
    level: 1,
  },
  {
    name: 'Automotive',
    sortScore: 50,
    level: 1,
  },
  {
    name: 'Books',
    sortScore: 60,
    level: 1,
  },
  {
    name: 'Baby',
    sortScore: 70,
    level: 1,
  },
  {
    name: 'Beauty and personal care',
    sortScore: 80,
    level: 1,
  },
  {
    name: "Women's Fashion",
    sortScore: 90,
    level: 1,
  },
  {
    name: "Men's Fashion",
    sortScore: 100,
    level: 1,
  },
  {
    name: "Girl's Fashion",
    sortScore: 110,
    level: 1,
  },
  {
    name: "Boy's Fashion",
    sortScore: 120,
    level: 1,
  },
  {
    name: 'Health and Household',
    sortScore: 130,
    level: 1,
  },
  {
    name: 'Industrial and Scientific',
    sortScore: 140,
    level: 1,
  },
  {
    name: 'Luggage',
    sortScore: 150,
    level: 1,
  },
  {
    name: 'Movies & Television',
    sortScore: 160,
    level: 1,
  },
  {
    name: 'Music, CDs & Vinyl',
    sortScore: 170,
    level: 1,
  },
  {
    name: 'Pet supplies',
    sortScore: 180,
    level: 1,
  },
  {
    name: 'Software',
    sortScore: 190,
    level: 1,
  },
  {
    name: 'Sports and Outdoors',
    sortScore: 200,
    level: 1,
  },
  {
    name: 'Tools & Home Improvement',
    sortScore: 210,
    level: 1,
  },
  {
    name: 'Toys and Games',
    sortScore: 220,
    level: 1,
  },
  {
    name: 'Video Games',
    sortScore: 230,
    level: 1,
  },
];

module.exports = async () => {
  for (const department of TopLvlDepartments) {
    const search = parseName(department.name);
    const dbEl = await Department.findOne({ name: department.name });

    if (dbEl) {
      const updateData = _.omit({
        ...department,
        search,
      }, ['name']);
      await Department.updateOne({ name: department.name }, { $set: updateData });
      continue;
    }
    await Department.create({
      ...department,
      search,
    });
  }

  console.log('task finished');
};
