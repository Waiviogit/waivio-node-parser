const config = require('config');
const {
  objectTypeParser, commentParser, createObjectParser, expect, sinon, faker, Post,
} = require('test/testHelper');
const redisQueue = require('utilities/redis/rsmq/redisQueue');
const _ = require('lodash');
const { AppFactory, PostFactory } = require('test/factories');
const { REDIS_QUEUE_DELETE_COMMENT } = require('constants/common');
const {
  getCreateObjectTypeMocks, getCreateObjectMocks, mockDeleteCommentOp, mockMetadataDeleteComment,
} = require('./mocks');

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
        let mockOp, stub;

        beforeEach(async () => {
          mockOp = await getCreateObjectMocks();
          stub = sinon.stub(createObjectParser, 'parse').returns({});
          await commentParser.parse(mockOp);
          // stubTTL = sinon.spy(redisSetter, 'setExpiredPostTTL');
        });
        afterEach(() => {
          sinon.restore();
        });

        it('should call createObjectParser.parse once', () => {
          expect(stub).to.be.calledOnce;
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

  describe('On deleteComment', async () => {
    let operation, metadata, result;
    beforeEach(async () => {
      operation = mockDeleteCommentOp();
      metadata = mockMetadataDeleteComment();
      await PostFactory.Create({
        root_author: operation.author,
        permlink: operation.permlink,
        additionsForMetadata: metadata,
      });
      sinon.spy(redisQueue, 'sendMessageToQueue');
    });
    afterEach(() => {
      sinon.restore();
    });
    describe('On error or empty metadata', async () => {
      it('should return false on validation operation failed', async () => {
        result = await commentParser.deleteComment(_.pick(operation, _.sample(['author', 'permlink'])));
        expect(result).to.be.equal(false);
      });

      it('should return false if post not found', async () => {
        operation[_.sample(['author', 'permlink'])] = faker.name.firstName().toLowerCase();
        result = await commentParser.deleteComment(operation);
        expect(result).to.be.equal(false);
      });

      it('should return false if post not have campaignId or reservation_permlink', async () => {
        const newMetadata = JSON.stringify(_.pick(metadata, _.sample(['campaignId', 'reservation_permlink'])));
        await Post.updateOne(
          {
            root_author: operation.author,
            permlink: operation.permlink,
          },
          { json_metadata: newMetadata },
        );

        result = await commentParser.deleteComment(operation);
        expect(result).to.be.equal(false);
      });
    });

    describe('On ok', async () => {
      it('should return true', async () => {
        result = await commentParser.deleteComment(operation);
        expect(result).to.be.equal(true);
      });

      it('should call redisQueue sendMessageToQueue called once', async () => {
        await commentParser.deleteComment(operation);
        expect(redisQueue.sendMessageToQueue).to.be.calledOnce;
      });

      it('should call redisQueue sendMessageToQueue with proper params', async () => {
        await commentParser.deleteComment(operation);
        expect(redisQueue.sendMessageToQueue).to.be.calledWith({
          message: JSON.stringify(metadata),
          qname: REDIS_QUEUE_DELETE_COMMENT,
        });
      });

      it('should post not exists', async () => {
        await commentParser.deleteComment(operation);
        const post = await Post.findOne({
          root_author: operation.author,
          permlink: operation.permlink,
        });
        expect(post).to.not.exist;
      });
    });
  });
});
