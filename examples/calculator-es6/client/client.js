/**
 * Created by asafdavid on 13/03/2017.
 */
import CalcClient from './calculatorClient';
import RabbitClient from '../config/rabbitClient';
import { EvaluationError } from '../service/errors';

RabbitClient.connect().then(() => {
  // Connect to rabbit and start listening for user input when connected.
  console.log('Enter expression to evaluate');
  const stdin = process.openStdin();
  stdin.addListener('data', (d) => {
    const expression = d.toString().trim();
    // For every non-empty input, use the Client class defined above to evaluate the expression.
    if (expression) {
      CalcClient.evaluate({ expression }).then(res => console.log('res', res))
      .catch((e) => {
        if (e instanceof EvaluationError) {
          console.log('received EvaluationError');
        }
      });
    }
  });
});
