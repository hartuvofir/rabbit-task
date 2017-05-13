
# Calculator example - ES6 version
This example uses rabbit-task to implement a simple calculator worker.
The worker receives messages containing a string representing a mathematical expression, evaluates it and returns the result to the caller.
This example also demonstrates passing custom error to the client.

## How to run
1. `yarn` in the root folder
2. `yarn --ignore-engines` in the root folder
3. `yarn build` in the root folder
4. `cd examples/calculator`
5. Run the worker using `gulp start-worker`.
6. Run the client using `gulp start-client`. Once the client is up, you can type in expressions, like "2 + 2".
