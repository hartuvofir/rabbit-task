# GEO example
This example uses rabbit-task's syntactic sugar to implement a simple geo encoding worker.
The worker receives messages containing a string representing an address,
geo encode it and returns a location.

## How to run
1. `yarn` in the root folder
2. `yarn --ignore-engines` in the root folder
3. `yarn build` in the root folder
4. `cd distExamples/geo`
5. Run the worker using `gulp start-worker`.
6. Run the client using `gulp start-client`. Once the client is up, you can type in addresses,
 like "13 David Avidan Street, Tel Aviv".
