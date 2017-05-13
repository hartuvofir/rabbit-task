/**
 * Created by meirshalev on 05/02/2017.
 */

/**
 * @type {{exchangeName: string, queueName: string, expressionEvalTopic: string}}
 */
const constants = {
  exchangeName: 'rabbittask.example.calculator.exchange',
  queueName: 'rabbittask.example.calculator.queue',
  expressionEvalTopic: 'CALCULATOR.EXPRESSION.EVAL',
};

module.exports = constants;
