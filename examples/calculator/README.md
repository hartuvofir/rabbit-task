# Calculator example
This example uses rabbit-task to implement a simple calculator worker.
The worker receives messages containing a string representing a mathematical expression, evaluates it and returns the result to the caller.

## How to run
1. `cd examples/calculator`
2. `npm install`
3. run the client using `gulp start-client`
4. run the server using `gulp start-server`

## The Client
The client is implemented in client/client.js. It defined a class named Client, which has a single method, evaluate, which sends the expression string to the worker and receives the result.
the rabbit-task connection object to send the request to the worker.

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
The worker has 5 short js files: worker.js, schema.js, router.js, configuration.js, calculatorHandler.js.
