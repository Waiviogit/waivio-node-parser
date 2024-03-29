const axios = require('axios');
const _ = require('lodash');
const {
  sinon, faker, expect, redisGetter,
} = require('test/testHelper');
const { PostFactory } = require('test/factories');
const notificationsUtil = require('utilities/notificationsApi/notificationsUtil');
const config = require('config');
const mocks = require('./mocks');

const { HOST, BASE_URL, SET_NOTIFICATION } = config.notificationsApi;
const URL = HOST + BASE_URL + SET_NOTIFICATION;

describe('On notificationsApi', async () => {
  let blockNum;
  beforeEach(async () => {
    blockNum = faker.random.number();
    sinon.stub(axios, 'post').returns(Promise.resolve('OK'));
    sinon.stub(redisGetter, 'getLastBlockNum').returns(Promise.resolve(blockNum));
    process.env.API_KEY = faker.random.string();
  });
  afterEach(async () => {
    sinon.restore();
  });
  describe('On post', async () => {
    let data, postData;
    beforeEach(async () => {
      postData = await PostFactory.Create({ onlyData: true });
      data = _.pick(postData, ['author', 'permlink', 'parent_author', 'parent_permlink', 'title', 'json_metadata', 'body']);
    });
    it('should send request to notificationsApi with correct params', async () => {
      await notificationsUtil.post(data, postData);
      postData.author = data.author;
      expect(axios.post).to.be.calledWith(URL, {
        id: 'comment',
        block: blockNum,
        data,
      }, { headers: { API_KEY: process.env.API_KEY } });
    });
    it('should send request to notificationsApi with guest user author', async () => {
      data.guestInfo = {
        userId: faker.name.firstName(),
      };
      await notificationsUtil.post(data);
      postData.author = data.guestInfo.userId;
      expect(axios.post).to.be.calledWith(URL, {
        id: 'comment',
        block: blockNum,
        data,
      }, { headers: { API_KEY: process.env.API_KEY } });
    });
  });
  describe('On comment', async () => {
    let operation;
    beforeEach(async () => {
      operation = await PostFactory.Create(
        { onlyData: true, parent_permlink: faker.random.string() },
      );
      operation.parent_author = faker.random.string();
    });
    it('should request to notificationsApi with correct params', async () => {
      await PostFactory.Create(
        { author: operation.parent_author, permlink: operation.parent_permlink },
      );
      await notificationsUtil.reply(operation);
      expect(axios.post).to.be.calledWith(URL, { id: 'comment', block: blockNum, data: operation }, { headers: { API_KEY: process.env.API_KEY } });
    });
    it('should request to notificationsApi with guest author params', async () => {
      await PostFactory.Create(
        { author: operation.parent_author, permlink: operation.parent_permlink },
      );
      const metadata = { comment: { userId: faker.name.firstName() } };
      await notificationsUtil.reply(operation, metadata);
      operation.author = metadata.comment.userId;
      expect(axios.post).to.be.calledWith(URL, { id: 'comment', block: blockNum, data: operation }, { headers: { API_KEY: process.env.API_KEY } });
    });
    it('should call notificationsApi method if post not exist', async () => {
      await notificationsUtil.reply({ operation });
      expect(axios.post).to.be.calledOnce;
    });
  });
  describe('On restaurantStatus', async () => {
    let objectName, voter, expert;
    beforeEach(async () => {
      objectName = faker.random.string();
      expert = faker.name.firstName();
      voter = faker.name.firstName();
    });
    it('should call axios post with correct params if status change to available', async () => {
      const mock = await mocks.restaurantMock({
        objectName, status: 'relisted', expert, voter,
      });
      await notificationsUtil.restaurantStatus(mock.data, mock.restaurant.author_permlink);
      expect(axios.post).to.be.calledOnceWith(URL, { id: 'restaurantStatus', block: blockNum, data: mock.data }, { headers: { API_KEY: process.env.API_KEY } });
    });
    it('should send notifications if status and voter not exists', async () => {
      const mock = await mocks.restaurantMock({
        objectName, status: 'relisted', expert,
      });
      await notificationsUtil.restaurantStatus(mock.data, mock.restaurant.author_permlink);
      expect(axios.post).to.be.calledOnce;
    });
    it('should not send notifications if status exist and no voter in params', async () => {
      const mock = await mocks.restaurantMock({ objectName, expert });
      await notificationsUtil.restaurantStatus(mock.data, mock.restaurant.author_permlink);
      expect(axios.post).to.be.not.called;
    });
    it('should not send notifications if wobject not exists', async () => {
      const mock = await mocks.restaurantMock({ objectName, expert });
      await notificationsUtil.restaurantStatus(mock.data, faker.random.string());
      expect(axios.post).to.be.not.called;
    });
  });
});
