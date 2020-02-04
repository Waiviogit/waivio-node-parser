const proxyquire = require('proxyquire');
const fs = require('fs');
const { faker, expect, sinon } = require('../../../testHelper');
const wobjectOperations = require('../../../../utilities/tasks/fillWobjectNames/wobjectOperations');
const mock = require('./mock');

describe('On fillEmptyFields', async () => {
  beforeEach(async () => {
    sinon.stub(fs, 'writeFileSync').returns(Promise.resolve('OK'));
  });
  afterEach(async () => {
    sinon.restore();
  });
  let mocks,
    wobjectOpsStub;
  it('should not call fs writeFile method if there are no objects in which fields are not added', async () => {
    mocks = mock();
    wobjectOpsStub = proxyquire('../../../../utilities/tasks/fillWobjectNames/wobjectOperations',
      { './objectBotRequest': () => 200 });
    await wobjectOpsStub.fillEmptyFields(mocks, 'www.waiviodev.com');
    expect(fs.writeFileSync.called).to.false;
  });
  it('should call fs writeFile method if list of objects without fields will not be empty', async () => {
    mocks = mock();
    wobjectOpsStub = proxyquire('../../../../utilities/tasks/fillWobjectNames/wobjectOperations',
      { './objectBotRequest': () => 401 });
    await wobjectOpsStub.fillEmptyFields(mocks, 'waiviodev.com');
    expect(fs.writeFileSync.called).to.true;
  });
  it('shouldnt entry to method if list of wobjects with will be empty ', async () => {
    sinon.spy(console, 'log');
    mocks = mock(true);
    await wobjectOperations.fillEmptyFields(mocks, 'www.waiviodev.com');
    expect(console.log.calledOnce).to.true;
  });
  it('should not get error without input data', async () => {
    await expect(wobjectOperations.fillEmptyFields()).to.not.be.rejected;
  });
  it('should not get error with incorrect input data', async () => {
    await expect(wobjectOperations.fillEmptyFields(faker.random.string(20), faker.random.string(10))).to.not.be.rejected;
  });
});
