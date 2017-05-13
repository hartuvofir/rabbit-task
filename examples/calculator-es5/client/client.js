/**
 * Created by meirshalev on 02/02/2017.
 */

const RabbitClient = require('../../../dist').Client;
const constants = require('../constants');

function Client(client) { // Constructor
  this.client = client;
  this.topicName = constants.expressionEvalTopic;
}

/**
 * Sends an expression to the worker to evaluate and prints the result of the evaluation.
 * @param expr the expression to evaluate
 */
Client.prototype.evaluate = function evaluate(expr) {
  this.client.sendSync(
    { serverExchangeName: constants.exchangeName },
    this.topicName,
    { expression: expr }
  ).then((result) => {
    const resultObject = JSON.parse(result.content.toString());
    const exprResult = resultObject.result;
    console.log(exprResult); // eslint-disable-line no-console
  }).catch(err => console.log(`error: ${JSON.stringify(err)}`)); // eslint-disable-line no-console
};

// Setup a new rabbit-task client.
const rabbitClient = new RabbitClient(constants.queueName, process.env.RABBIT_CONSUMER_TAG);

rabbitClient.connect().then(() => {
  // Connect to rabbit and start listening for user input when connected.
  const client = new Client(rabbitClient);

  console.log('Enter expression to evaluate'); // eslint-disable-line no-console
  const stdin = process.openStdin();
  stdin.addListener('data', (d) => {
    const input = d.toString().trim();
    // For every non-empty input, use the Client class defined above to evaluate the expression.
    if (input) {
      client.evaluate(input);
    }
  });
});
