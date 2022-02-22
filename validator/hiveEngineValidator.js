const Joi = require('@hapi/joi');

const options = { allowUnknown: true, stripUnknown: true, abortEarly: false };

exports.createDepositSchema = Joi.object().keys({
  transactionId: Joi.string().required(),
  account: Joi.string().required(),
  symbolIn: Joi.string().required(),
  symbolOut: Joi.string().required(),
  destination: Joi.string().required(),
  pair: Joi.string().required(),
  ex_rate: Joi.number().default(1),
  address: Joi.string(),
  depositAccount: Joi.string(),
  memo: Joi.string(),
  refHiveBlockNumber: Joi.number().required(),
  operation: Joi.string().required(),
  timestamp: Joi.number().required(),
}).xor('address', 'depositAccount').options(options);
