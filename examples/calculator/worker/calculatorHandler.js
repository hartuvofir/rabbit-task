/**
 * Created by meirshalev on 05/02/2017.
 */
var schema = require('./schema');
var JsonSchemaHandler = require('../../../lib/handlers/jsonSchemaHandler');
var math = require('mathjs'); // A nice math library that can evaluate string expressions.
var constants = require('../constants');

var calculatorHandler =  {
  name: 'calculatorHandler',
  pattern: constants.expressionEvalTopic,
  base: JsonSchemaHandler,
  handle: evaluate,
  options: {
    schema: schema
  }
};

function evaluate(msg) {
  var expression = msg.expression;
  console.log('received expression: ' + expression);

  var result = math.eval(expression);
  console.log('result: ' + result);
  return { result: result };
}

module.exports = calculatorHandler;