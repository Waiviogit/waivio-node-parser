const axios = require('axios');
const {
  expect, importTags, importUpdates, sinon,
} = require('../testHelper');

describe('importTags service', async () => {
  describe('on success', async () => {
    let stub,
      result;
    beforeEach(async () => {
      stub = sinon.stub(axios, 'post').callsFake(async () => ({ data: 'this is mock data' }));
      result = await importTags.send(['test']);
    });

    afterEach(() => stub.restore());

    it('should return response', () => expect(result).to.has.key('response'));

    it('should return correct response', () => expect(result.response).to.eq('this is mock data'));

    it('should not return error', () => expect(result).to.not.has.key('error'));

    it('should call axios.post with correct data', () => {
      const secondArg = stub.getCall(0).args[1];
      expect(secondArg).to.deep.eq({ tags: ['test'] });
    });

    it('should return undefined if input data is invalid', async () => {
      const res = await importTags.send('lala');
      expect(res).to.be.undefined;
    });
  });

  describe('on error', async () => {
    let stub,
      result;
    beforeEach(async () => {
      stub = sinon.stub(axios, 'post').callsFake(async () => {
        throw new Error('this is test');
      });
      result = await importTags.send(['test']);
    });

    afterEach(() => stub.restore());

    it('should return error', () => {
      expect(result).to.has.key('error');
    });

    it('should return correct error', () => {
      expect(result.error.message).to.be.eq('this is test');
    });
  });

  describe('on not enough response data', async () => {
    let stub,
      result;
    beforeEach(async () => {
      stub = sinon.stub(axios, 'post').callsFake(async () => ({}));
      result = await importTags.send(['test']);
    });

    afterEach(() => stub.restore());

    it('should return error', () => {
      expect(result).to.has.key('error');
    });

    it('should return correct error', () => {
      expect(result.error.message).to.be.eq('Not enough response data!');
    });
  });
});

describe('importUpdates service', async () => {
  describe('on valid input', async () => {
    let stub,
      result;
    beforeEach(async () => {
      stub = sinon.stub(axios, 'post').callsFake(async () => ({ data: 'this is mock data' }));
      result = await importUpdates.send([{ mock: 'data' }]);
    });

    afterEach(() => stub.restore());

    it('should return response', () => expect(result).to.has.key('response'));

    it('should return correct response', () => expect(result.response).to.eq('this is mock data'));

    it('should not return error', () => expect(result).to.not.has.key('error'));

    it('should call axios.post with correct data', () => {
      const secondArg = stub.getCall(0).args[1];
      expect(secondArg).to.deep.eq({ wobjects: [{ mock: 'data' }] });
    });

    it('should return undefined if input data is invalid', async () => {
      const res = await importUpdates.send('lala');
      expect(res).to.be.undefined;
    });

    it('should return undefined if input array empty', async () => {
      const res = await importUpdates.send([]);
      expect(res).to.be.undefined;
    });
  });

  describe('on request error', async () => {
    let stub,
      result;
    beforeEach(async () => {
      stub = sinon.stub(axios, 'post').callsFake(async () => {
        throw new Error('Test error!');
      });
      result = await importUpdates.send([{ mock: 'data' }]);
    });

    afterEach(() => stub.restore());

    it('should return error', () => {
      expect(result).to.has.key('error');
    });

    it('should return correct error', () => {
      expect(result.error.message).to.be.eq('Test error!');
    });
  });

  describe('on not enough response data', async () => {
    let stub,
      result;
    beforeEach(async () => {
      stub = sinon.stub(axios, 'post').callsFake(async () => ({}));
      result = await importUpdates.send([{ mock: 'data' }]);
    });

    afterEach(() => stub.restore());

    it('should return error', () => {
      expect(result).to.has.key('error');
    });

    it('should return correct error', () => {
      expect(result.error.message).to.be.eq('Not enough response data!');
    });
  });
});
