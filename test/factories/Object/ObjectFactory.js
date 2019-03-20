const {WObject, faker, getRandomString} = require('../../testHelper');
const ObjectTypeFactory = require('../ObjectType/ObjectTypeFactory');

const Create = async () => {
    const objectType = await ObjectTypeFactory.Create();
    const default_name = faker.address.city().toLowerCase();
    const is_posting_open = true;
    const is_extending_open = true;
    const creator = faker.name.firstName().toLowerCase();
    const author = faker.name.firstName().toLowerCase();
    const author_permlink = `${getRandomString(3)}-${default_name}`;
    const object_type = objectType.name;
    const wobject = await WObject.create({
        author_permlink,
        author,
        creator,
        is_extending_open,
        is_posting_open,
        object_type,
        default_name
    });
    return wobject
};

module.exports = {Create}