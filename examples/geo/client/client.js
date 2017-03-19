/**
 * Created by asafdavid on 13/03/2017.
 */
import GeoClient from './geoClient';
import RabbitClient from '../config/rabbitClient';

RabbitClient.connect().then(() => {
  // Connect to rabbit and start listening for user input when connected.
  console.log('Enter an address to geo encode');
  const stdin = process.openStdin();
  stdin.addListener('data', (d) => {
    const address = d.toString().trim();
    // For every non-empty input, use the Client class defined above to evaluate the expression.
    if (address) {
      GeoClient.encode({ address }).then(res => console.log('res', res));
    }
  });
});
