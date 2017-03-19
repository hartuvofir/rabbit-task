/**
 * Created by meirshalev on 05/02/2017.
 */
const schema = require('./schema');
const JoiMiddleware = require('../../../dist').JoiMiddleware;
// A nice math library that can evaluate string expressions.
const math = require('mathjs'); // eslint-disable-line import/no-extraneous-dependencies
const constants = require('../constants');

function evaluate({ content: { expression } }) {
  console.log(`received expression: ${expression}`);
  const result = math.eval(expression);
  console.log(`result: ${result}`);
  return Promise.resolve({ result });
}

const calculatorHandler = {
  name: 'calculatorHandler',
  pattern: constants.expressionEvalTopic,
  middleware: {
    pre: [JoiMiddleware.pre],
    post: [JoiMiddleware.post],
  },
  handle: evaluate,
  options: {
    joi: {
      schema,
    },
  },
};


module.exports = calculatorHandler;
