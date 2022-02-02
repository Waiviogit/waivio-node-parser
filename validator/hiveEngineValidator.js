const Joi = require('@hapi/joi');

const options = { allowUnknown: true, stripUnknown: true };

exports.createDepositSchema = Joi.object().keys({
  userName: Joi.string().required(),
  from_coin: Joi.string().required(),
  to_coin: Joi.string().required(),
  destination: Joi.string().required(),
  pair: Joi.string().required(),
  ex_rate: Joi.number().required(),
  address: Joi.string(),
  account: Joi.string(),
  memo: Joi.string(),
  blockNum: Joi.number().required(),
}).xor('address', 'account').options(options);
