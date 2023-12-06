const { engineProxy } = require('./engineQuery');

exports.getTransactionInfo = async (txid) => engineProxy({
  method: 'getTransactionInfo',
  endpoint: '/blockchain',
  params: { txid },
});
