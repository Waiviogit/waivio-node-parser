const _ = require('lodash');
const {
  expect, AppModel, faker, config,
} = require('test/testHelper');
const {
  AppFactory, UserFactory, ObjectFactory,
} = require('test/factories');

describe('App model', async () => {
  describe('On getOne', () => {
    let app, result;

    beforeEach(async () => {
      app = await AppFactory.Create();
    });
    it('Should check names for identity', async () => {
      result = await AppModel.getOne({ name: app.name });
      expect(result.app.name).to.deep.eq(app._doc.name);
    });

    it(' Should check that the error exists', async () => {
      result = await AppModel.getOne({ name: faker.random.string() });
      expect(result.error).is.exist;
    });
    it(' Should return error message', async () => {
      result = await AppModel.getOne({ name: faker.random.string() });
      expect(result.error.message).to.eq('App not found!');
    });
  });
  describe('On updateChosenPost', async () => {
    let app, result, name, author, permlink, title;
    beforeEach(async () => {
      author = faker.name.firstName();
      permlink = faker.random.string();
      title = faker.random.string(20);
      name = faker.name.firstName();
      app = await AppFactory.Create({ host: config.appHost, name });
    });
    it('should update daily post', async () => {
      result = await AppModel.updateChosenPost({
        name, author, permlink, title,
      });
      expect(app.daily_chosen_post).not.eq(result.app.daily_chosen_post);
    });
    it('should not update weekly post', async () => {
      result = await AppModel.updateChosenPost({
        name, author, permlink, title,
      });
      expect(app.weekly_chosen_post.toObject()).to.deep.eq(result.app.weekly_chosen_post.toObject());
    });
    it('should update weekly post', async () => {
      result = await AppModel.updateChosenPost({
        name, author, permlink, title, period: 'weekly',
      });
      expect(app.weekly_chosen_post).not.eq(result.app.weekly_chosen_post);
    });
    it('should not update app with not full data', async () => {
      result = await AppModel.updateChosenPost({
        name, permlink, title, period: 'weekly',
      });
      expect(result.app.weekly_chosen_post.author).is.null;
    });
    it('should return error without data', async () => {
      result = await AppModel.updateChosenPost({});
      expect(result.app).is.null;
    });
    it('should not update app with incorrect period', async () => {
      result = await AppModel.updateChosenPost({
        name, author, permlink, title, period: faker.random.string(),
      });
      expect(result.app.weekly_chosen_post.toObject(), result.app.daily_chosen_post.toObject())
        .to.deep.eq(app.weekly_chosen_post.toObject(), app.daily_chosen_post.toObject());
    });
  });
  describe('On findByModeration', async () => {
    let admin, moderator, wobject;
    beforeEach(async () => {
      admin = (await UserFactory.Create()).user;
      moderator = (await UserFactory.Create()).user;
      wobject = await ObjectFactory.Create();
      await AppFactory.Create({
        admins: [admin.name],
        moderators: [moderator.name],
      });
    });
    it('Should return app by searching by userName only(admin)', async () => {
      const result = await AppModel.findByModeration(admin.name);
      expect(result.apps).to.be.not.empty;
    });
    it('Should not return app with not valid userName', async () => {
      const result = await AppModel.findByModeration(faker.name.firstName());
      expect(result.apps).to.be.empty;
    });
    it('should return app by searching by moderator and wobject', async () => {
      const result = await AppModel.findByModeration(moderator.name);
      expect(result.apps).to.not.be.empty;
    });
  });
});
