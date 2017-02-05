/**
 * Created by meirshalev on 02/02/2017.
 */

var RabbitClient = require('../../../lib/client');
var constants = require('../constants');

function Client(client) { // Constructor
  this.client = client;
  this.topicName = constants.expressionEvalTopic;
}

/**
 * Sends an expression to the worker to evaluate and prints the result of the evaluation.
 * @param expr the expression to evaluate
 */
Client.prototype.evaluate = function(expr) {
  this.client.sendSync({ serverExchangeName: constants.exchangeName },  this.topicName, { expression: expr })
    .then(function(result) {
      var resultObject = JSON.parse(result.content.toString());
      var exprResult = resultObject.result;
      console.log(exprResult);
    })
    .catch(function(err) { console.log('error: ' + JSON.stringify(err)) });
};

var rabbitClient = new RabbitClient(constants.queueName, process.env.RABBIT_CONSUMER_TAG); // Setup a new rabbit-task client.

rabbitClient.connect().then(function () { // Connect to rabbit and start listening for user input when connected.
  var client = new Client(rabbitClient);

  console.log('Enter expression to evaluate');
  var stdin = process.openStdin();
  stdin.addListener('data', function(d) {
    var input = d.toString().trim();
    if (input) { // For every non-empty input, use the Client class defined above to evaluate the expression.
      client.evaluate(input);
    }
  });
});