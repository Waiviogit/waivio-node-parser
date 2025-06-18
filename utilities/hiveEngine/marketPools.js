const { engineProxy } = require('utilities/hiveEngine/engineQuery');

exports.getMarketPools = async ({ query, hostUrl }) => engineProxy({
  params: {
    contract: 'marketpools',
    table: 'pools',
    query,
  },
  hostUrl,
});

exports.getMarketPoolsParams = async ({ query } = { query: {} }) => engineProxy({
  params: {
    contract: 'marketpools',
    table: 'params',
    query,
  },
});
