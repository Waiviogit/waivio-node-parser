const _ = require('lodash');
const {
  userParsers, User, expect, sinon, faker,
} = require('../../testHelper');
const { accountUpdate } = require('../../../utilities/guestOperations/customJsonOperations');
const constants = require('../../../utilities/constants');
const { UserFactory } = require('../../factories');
const { User: UserModel } = require('../../../models');

describe('customJsonOperations', async () => {
  let mockListBots;
  beforeEach(async () => {
    mockListBots = _.times(5, faker.name.firstName);
    sinon.stub(constants, 'WAIVIO_PROXY_BOTS').value(mockListBots);
  });
  afterEach(() => {
    sinon.restore();
  });
  describe('on accountUpdate', async () => {
    let user,
      updUser,
      mockOp,
      mockJson;

    beforeEach(async () => {
      user = (await UserFactory.Create()).user;
      mockJson = {
        account: user.name,
        json_metadata: JSON.stringify({
          profile: { name: faker.name.firstName(), about: faker.lorem.sentence() },
        }),
      };
      mockOp = {
        required_posting_auths: [mockListBots[0]],
        id: 'waivio_guest_account_update',
        json: JSON.stringify(mockJson),
      };
      sinon.spy(userParsers, 'updateAccountParser');
      sinon.spy(UserModel, 'updateOne');
      await accountUpdate(mockOp);
      updUser = await User.findOne({ name: user.name }).lean();
    });
    afterEach(() => {
      sinon.restore();
    });
    it('should call userParser once', () => {
      expect(userParsers.updateAccountParser).to.be.calledOnce;
    });
    it('should call User model updateOne once', () => {
      expect(UserModel.updateOne).to.be.calledOnce;
    });
    it('should update json_metadata with correct values', () => {
      expect(updUser.json_metadata).to.be.eq(mockJson.json_metadata);
    });
  });
});
