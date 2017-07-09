/**
 * Created by ofirHar on 04/07/2017.
 */
import FaxClient from './faxClient';
import RabbitClient from '../config/rabbitClient';
import { FaxError } from '../service/errors';

RabbitClient.connect().then(() => {
    // Connect to rabbit and start listening for user input when connected.
    console.log('Enter the amount of faxes you would like to send:');
    const stdin = process.openStdin();
    let faxNum = 0;
    stdin.addListener('data', (d) => {
        const amountOfFaxes = d.toString().trim();

        if (amountOfFaxes && !isNaN(amountOfFaxes)) {
            let faxData;
            for(let i = 0 ; i < amountOfFaxes; i++,faxNum++){
                 console.log(`sending fax num : ${faxNum}`);
                 faxData =`Fax num ${faxNum}`;

                 FaxClient.fax({ faxData }).then( (res) => console.log(res))
                    .catch((e) => {
                        if (e instanceof FaxError) {
                          console.log('received FaxError');
                        }
                    });
            }
        }
    });
});
