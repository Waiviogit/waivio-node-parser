const engineQuery = require('./engineQuery');

exports.getTransactionInfo = async (txid) => engineQuery({
  method: 'getTransactionInfo',
  endpoint: '/blockchain',
  params: { txid },
});
