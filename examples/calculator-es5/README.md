
# Calculator example
This example uses rabbit-task to implement a simple calculator worker.
The worker receives messages containing a string representing a mathematical expression, evaluates it and returns the result to the caller.

## How to run
1. `yarn` in the root folder
2. `yarn --ignore-engines` in the root folder
3. `yarn build` in the root folder
4. `cd examples/calculator`
5. Run the worker using `gulp start-worker`.
6. Run the client using `gulp start-client`. Once the client is up, you can type in expressions, like "2 + 2".

## The Client
The client is implemented in client/client.js. It defines a class named Client, which has a single method called evaluate, which sends the expression string to the worker and receives the result of the evaluation.

It uses a rabbit-task connection object to send the request to the worker, using the `sendSync` method. 
This method sends the message to the specified exchange with the specified topic (also called "pattern" on the handler, on the worker's side).
`sendSync` returns a promise to the reply that will be received from the worker.

```javascript
function Client(client) { // Constructor
  this.client = client;
  this.topicName = constants.expressionEvalTopic;
}

Client.prototype.evaluate = function(expr) {
  this.client.sendSync({ serverExchangeName: constants.exchangeName },  this.topicName, { expression: expr })
    .then(function(result) {
      var resultObject = JSON.parse(result.content.toString());
      var exprResult = resultObject.result;
      console.log(exprResult);
    })
    .catch(function(err) { console.log('error: ' + JSON.stringify(err)) });
};
```

## The Worker
The worker has 5 short .js files: `worker.js`, `schema.js`, `router.js`, `configuration.js` and `calculatorHandler.js`.

### calculatorHandler.js
This file defines what happens when a calculation request is received by the worker.
It uses the following properties:
* `pattern` - a pattern that defines which messages are processed as calculation requests, also called "topic".
* `name` - the name of the hadler.
* `option` - containing the schema of the messages.
* `handle` - the handler function which does the calculation.
* `base` - a base class for the handler to inherite from. router.js uses this base class to initiate a new object and set its properties to be the ones we set here.

This is how the code looks:
```javascript
calculatorHandler =  {
  name: 'calculatorHandler',
  pattern: constants.expressionEvalTopic,
  base: ContextStoreHandler,
  handle: evaluate,
  options: {
    schema: schema
  }
};

function evaluate(msg) {
  var expression = msg.content.expression;

  var result = math.eval(expression); // mathjs is used to evaluate the expression
  return { result: result };
}

module.exports = calculatorHandler;
```
### schema.js
This file defines the schema for the messages that are being sent as calculation requests. Schemas are defined using [Joi](https://github.com/hapijs/joi).
We have here a very simple schema that only has one field - the expression to calculate.

```javascript
var Joi = require('joi');

var messageSchema = Joi.object().keys({
  expression: Joi.string().required()
});

module.exports = messageSchema;
```
### router.js
This file defines our router, which is used to map requests to handlers.
In this case we only have one hanldler (calculatorHandler.js), so the code looks like this:
```javascript
var router = new HandlerRouter([
  CalculatorHandler
]);

module.exports = router;
```
### configuration.js
This class is responsible for setting up Rabbit for this example, which includes creating a dedicated exchange, a queue and binding them together (using 'fanout').
```javascript
function Configuration(conn) {
  this.conn = conn;
}

Configuration.prototype.configure = function() {
  return this.configExchanges()
  .then(this.configQueues.bind(this))
  .then(this.configBindings.bind(this)).then(function() { console.log('configured Rabbit') } );

};

Configuration.prototype.configExchanges = function() {
  return this.conn.channel.assertExchange(
    EXCHANGE_NAME,
    'fanout',
    { durable: true });
};

Configuration.prototype.configQueues = function() {

  return this.conn.channel.assertQueue(QUEUE_NAME, {
    durable: true
  });
};


Configuration.prototype.configBindings = function() {
  return this.conn.channel.bindQueue(QUEUE_NAME, EXCHANGE_NAME);
};

module.exports = Configuration;
```
### worker.js
This file binds it all togher to create our worker and then starts it.
```javascript
var Worker = require('../../../lib/worker');
var Connection = require('../../../lib/connection');
var router = require('./router');
var Configuration = require('./configuration');
var constants = require('../constants');

var queueName = constants.queueName;
var conn = new Connection(process.env.RABBIT_URL);
var config = new Configuration(conn);
var worker = new Worker(
  'calculator-worker-worker',
  conn,
  queueName,
  router,
  function() { return config.configure() }
);

worker.start();
```


