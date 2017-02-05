/**
 * Created by meirshalev on 02/02/2017.
 */

var Joi = require('joi');

var messageSchema = Joi.object().keys({
  expression: Joi.string().required()
});

module.exports = messageSchema;