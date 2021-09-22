const config = require('config');
const {
  objectTypeParser, commentParser, createObjectParser, expect, sinon,
} = require('test/testHelper');
const redisSetter = require('utilities/redis/redisSetter');
const { AppFactory } = require('test/factories');
const { getCreateObjectTypeMocks, getCreateObjectMocks } = require('./mocks');

describe('comment parser', async () => {
  describe('when get operation with "parent_author"', async () => {
    describe('metadata include wobj with action', async () => {
      describe('createObjectType', async () => {
        let mockOp;
        let stub;

        beforeEach(async () => {
          mockOp = await getCreateObjectTypeMocks();
          stub = sinon.stub(objectTypeParser, 'parse').callsFake(async (a, b) => ({}));
          await commentParser.parse(mockOp);
        });
        afterEach(() => {
          stub.restore();
        });

        it('should call objectTypeParser.parse once', () => {
          expect(stub.calledOnce).to.be.true;
        });

        it('should call with correct first argument', async () => {
          const firstArg = stub.getCall(0).args[0];

          expect(firstArg).to.deep.equal(mockOp);
        });

        it('should call with correct first argument', async () => {
          const secondArg = stub.getCall(0).args[1];
          const expectedArg = JSON.parse(mockOp.json_metadata);

          expect(secondArg).to.deep.equal(expectedArg);
        });
      });

      describe('createObjectType from app at blacklist', () => {
        let mockOp, app, stub;

        beforeEach(async () => {
          app = await AppFactory.Create({ host: config.appHost, blacklistApps: ['apptest', 'lala', 'kek'] });
          mockOp = await getCreateObjectTypeMocks('apptest');
          stub = sinon.stub(objectTypeParser, 'parse').callsFake(async () => ({}));
          await commentParser.parse(mockOp);
        });
        afterEach(() => {
          stub.restore();
          delete process.env.APP_NAME;
        });
        it('should NOT call objectTypeParser.parse', () => {
          expect(stub.called).to.be.false;
        });
      });
    });
  });

  describe('when get operation without "parent_author"', async () => {
    describe('metadata include wobj with action', async () => {
      describe('createObject', async () => {
        let mockOp, stub, stubTTL;

        beforeEach(async () => {
          mockOp = await getCreateObjectMocks();
          stub = sinon.stub(createObjectParser, 'parse').returns({});
          await commentParser.parse(mockOp);
          stubTTL = sinon.spy(redisSetter, 'setExpiredPostTTL');
        });
        afterEach(() => {
          sinon.restore();
        });

        it('should call createObjectParser.parse once', () => {
          expect(stub).to.be.calledOnce;
        });

        it('should call setExpiredPostTTL once', async () => {
          await redisSetter
            .setExpiredPostTTL('hiveComment', `${mockOp.author}/${mockOp.permlink}/true`, 4);
          expect(stubTTL).to.be.calledOnce;
        });

        it('should call setExpiredPostTTL with params', async () => {
          await redisSetter
            .setExpiredPostTTL('hiveComment', `${mockOp.author}/${mockOp.permlink}/true`, 4);
          expect(stubTTL).to.be.calledWith('hiveComment', `${mockOp.author}/${mockOp.permlink}/true`, 4);
        });

        it('should call with correct first argument', async () => {
          const firstArg = stub.getCall(0).args[0];
          expect(firstArg).to.deep.equal(mockOp);
        });

        it('should call with correct second argument', async () => {
          const secondArg = stub.getCall(0).args[1];
          const expectedArg = JSON.parse(mockOp.json_metadata);
          expect(secondArg).to.deep.equal(expectedArg);
        });
      });
    });
  });
});
