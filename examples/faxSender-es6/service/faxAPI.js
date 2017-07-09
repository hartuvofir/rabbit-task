import pg from 'pg';
import math from 'mathjs';
import * as Errors from './errors';

const insertQuery = { name: 'insert-fax',  text: 'INSERT INTO "faxTable" ("Content", "Sent") VALUES ($1, $2)'};

export default class FaxAPI{

    static sendInterval;
    static lastTimeSent; // mocking a valid time which represent the last sending
    static dbClient;

    static init(interval,syncDBCredentials){
        console.log("Init");
        FaxAPI.sendInterval = interval;
        FaxAPI.lastTimeSent =  math.sum(Date.now() ,- interval);
        FaxAPI.dbClient = FaxAPI._connect(syncDBCredentials);
        console.log(`Init sendInterval: ${FaxAPI.sendInterval} AND lastTimeSent: ${FaxAPI.lastTimeSent}`);
    }

    static sendFax(faxContent,timeSent,callback){
            console.log(`Try to print fax : ${faxContent} timeSent : ${timeSent}`);

            try{
                console.log(`FaxAPI.sendInterval: ${FaxAPI.sendInterval}, FaxAPI.lastTimeSent: ${FaxAPI.lastTimeSent}, FaxAPI.dbClient: ${FaxAPI.dbClient}`);
                if (math.sum(timeSent, -FaxAPI.lastTimeSent) < FaxAPI.sendInterval){
                    console.log(`Cannot print fax in a interval lower then ${FaxAPI.sendInterval}, por favor!`);
                    callback (new Errors.FaxError(`Cannot print fax in a interval lower then ${FaxAPI.sendInterval}, por favor!`));
                }
                if(!FaxAPI.dbClient){
                    console.log(`Cannot connect to fax machine (db-connection-problem)!`);
                    callback (new Errors.FaxError(`Cannot connect to fax machine (db-connection-problem)!`));
                }

                FaxAPI.dbClient.query(insertQuery,[faxContent,new Date(timeSent)], (insertErr, insertRes) => {
                    if (insertErr){
                        console.log(`Error while trying to print fax (Error: ${insertErr.stack})`);
                        callback (new Errors.FaxError(`Error while trying to print fax (Error: ${insertErr.stack})`));
                    }
                    else if (insertRes.rowCount === 1){
                        console.log(`Print successfully the fax ${faxContent}`);
                        callback(`Print successfully the fax ${faxContent}`);
                    }
                });

            }
            catch(err){
                callback (new Errors.FaxError(`Error while trying to print fax (Error: ${err.stack})`));
            }
    }

    static _connect(dbCredentials){
        console.log('Try connect to fax db');

        let client = new pg.Client({
            user: dbCredentials.user,
            password: dbCredentials.password,
            database: dbCredentials.database,
            host: dbCredentials.host,
            port: dbCredentials.port
        });

        client.connect((err) => {
            if (err){
                console.log(err);
                return null;
            }
        });
        console.log('success to connect the fax db');
        return client;
    }
}