const {
  vipTicketsHelper, sinon, transferParser, faker, expect,
} = require('test/testHelper');
const notificationsUtil = require('utilities/notificationsApi/notificationsUtil');
const { TICKETS_ACCOUNT } = require('constants/vipTicketsData');
const { getTransferOperation } = require('./mocks');

describe('On transfer parser', async () => {
  describe('On ticket purchase', async () => {
    beforeEach(async () => {
      sinon.spy(vipTicketsHelper, 'processTicketPurchase');
      sinon.spy(notificationsUtil, 'custom');
    });
    afterEach(() => {
      sinon.restore();
    });
    describe('Guest user', async () => {
      beforeEach(async () => {
        await transferParser.parse(getTransferOperation({
          to: TICKETS_ACCOUNT,
          memo: JSON.stringify({
            id: 'waivio_guest_transfer',
            from: faker.random.string(),
          }),
        }));
      });
      it('should call processTicketPurchase once when guest buying', async () => {
        expect(vipTicketsHelper.processTicketPurchase).to.be.calledOnce;
      });
      it('should call notificationsUtil once when guest buying', async () => {
        expect(notificationsUtil.custom).to.be.calledOnce;
      });
    });
    describe('Hive User', async () => {
      beforeEach(async () => {
        await transferParser.parse(getTransferOperation({ to: TICKETS_ACCOUNT }));
      });
      it('should call processTicketPurchase when regular user buying ticket', async () => {
        expect(vipTicketsHelper.processTicketPurchase).to.be.calledOnce;
      });
      it('should call notificationsUtil once when guest buying', async () => {
        expect(notificationsUtil.custom).to.be.calledOnce;
      });
    });
  });
});
