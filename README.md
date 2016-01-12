# rabbit-task
An opinionated RabbitMQ worker. 
This package provides a very simple and easy to use rabbit worker that consumes messages, handles them and responds accordingly. The worker abstracts rabbit layer and handles connectivity for you and let you foucs on implementing your logic and microservices. 

## How to get it ?
```
npm install rabbit-task
```

## Example
```javascript
var Connection = require('rabbit-task').Connection;
var Worker = require('rabbit-task').Worker;
var conn = new Connection(process.env.connectionString);
var router = require('./routes'); // Define your message handlers 

// Start a worker and define queues
var worker = new Worker(
  'my-awesome-worker',
  conn,
  'my-work-queue',
  router,
  Promise.resolve() // Config phase
);

worker.start();
```

## Docs
coming soon (defaultHandler docs too)

## Requirements 
- Node version > 4.0.0
