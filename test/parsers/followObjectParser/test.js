const {
  dropDatabase, expect, faker, sinon, UserModel, WobjModel, userHelper,
} = require('test/testHelper');
const { followObjectParser } = require('parsers');
const mock = require('./mock');

describe('followObjectParser', async () => {
  describe('On followObjectParse and errors', async () => {
    let data,
      result,
      name,
      author_permlink;
    beforeEach(async () => {
      sinon.stub(userHelper, 'checkAndCreateUser').returns({ user: 'its ok' });
      sinon.stub(UserModel, 'addObjectFollow').callsFake(() => ({ result: true }));
      sinon.stub(WobjModel, 'getOne').callsFake(() => ({ wobject: true }));
      await dropDatabase();
      name = faker.name.firstName();
      author_permlink = faker.random.string(10);
      data = await mock.dataForFollow(
        { follow: true, auth_permlink: author_permlink, userName: name },
      );
    });
    afterEach(() => {
      sinon.restore();
    });
    it('should success follow to wobject', async () => {
      result = await followObjectParser.parse(data);
      expect(result).to.eq(`User ${name} now following wobject ${author_permlink}!\n`);
    });
    it('should get error with incorrect data', async () => {
      result = await followObjectParser.parse(faker.random.string(20));
      expect(result.message).to.eq('Unexpected token u in JSON at position 0');
    });
    it('should not work without author_permlink', async () => {
      result = await followObjectParser.parse({ json: '["follow",{"user": "name","what":[]}]' });
      expect(result).is.undefined;
    });
    it('should not work without author', async () => {
      result = await followObjectParser.parse({ json: '["follow",{"author_permlink": "name","what":[]}]' });
      expect(result).is.undefined;
    });
    it('should not work without what', async () => {
      result = await followObjectParser.parse({ json: '["follow",{"author_permlink": "name","what":[]}]' });
      expect(result).is.undefined;
    });
    it('should return 404 on follow not exist wobject', async () => {
      sinon.restore();
      sinon.stub(WobjModel, 'getOne').callsFake(() => ({ error: { status: 404, message: 'Wobject not found!' } }));
      const mockOp = await mock.dataForFollow(
        { follow: true, auth_permlink: faker.random.string(10), userName: name },
      );
      result = await followObjectParser.parse(mockOp);
      expect(result.status).to.eq(404);
    });
    it('should not submit follow if user in json and author of operation are different', async () => {
      result = await followObjectParser.parse(
        { ...data, required_posting_auths: [faker.name.firstName()] },
      );
      expect(result).to.be.undefined;
    });
  });
  describe('On unfollowObjectParse', async () => {
    let data,
      result,
      name,
      author_permlink;
    beforeEach(async () => {
      await dropDatabase();
      sinon.stub(UserModel, 'removeObjectFollow').callsFake(() => ({ result: true }));
      name = faker.name.firstName();
      author_permlink = faker.random.string(10);
      data = await mock.dataForFollow({ auth_permlink: author_permlink, userName: name });
    });
    afterEach(async () => {
      sinon.restore();
    });
    it('should success unfollow', async () => {
      result = await followObjectParser.parse(data);
      expect(result).to.deep.eq(`User ${name} now unfollow wobject ${author_permlink} !\n`);
    });
  });
});
