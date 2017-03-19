/**
 * Created by meirshalev on 02/02/2017.
 */
const Joi = require('joi');

const messageSchema = Joi.object().keys({
  expression: Joi.string().required(),
});

module.exports = messageSchema;
