/**
 * Created by Owner on 7/3/2017.
 */
import pg from 'pg';
import math from 'mathjs';
import Logger from '../../lib/logger';

const Log = Logger.instance;
const updateQuery = { name: 'select-time',  text: 'UPDATE "syncTable" SET "LastExecuteTime"=$1 WHERE "ID"=1 AND "LastExecuteTime"<$2' };

export default class PullSyncer{

    constructor(minInterval,pullEmitter,dbCredentials){
        this.minInterval = minInterval;
        this.pullEmitter = pullEmitter;

        this.pullEmitter.once('start',()=>{
            this._start(dbCredentials)
        });
    }

    _start(dbCredentials){
        try{
            // connect to the db
            this.client = this._connect(dbCredentials);
            if(this.client){
               this.pullEmitter.on('finish',()=> this._tryPull()); // raised after every failed pulling or full invocation cycle;
               this._tryPull(); // for the first time
            }
        }
        catch(e){
            Log.error(`PullSyncer: Error while trying to connect sync DB, sync pulling is down - Error: ${e}`);
        }
    }

    _connect(dbCredentials){
        let client = new pg.Client({
            user: dbCredentials.user,
            password: dbCredentials.password,
            database: dbCredentials.database,
            host: dbCredentials.host,
            port: dbCredentials.port
        });

        Log.info(`PullSyncer: Try connect to DB with the credentials: user: ${client.user}, 
                  database: ${client.database}, port: ${client.port} , host: ${client.host}`);

        client.connect((err) => {
                if (err){
                    Log.error(`PullSyncer: Error while trying to connect sync DB, sync pulling is down - Error: ${err}`);
                    return null;
                }
            });
        Log.info(`PullSyncer: Connected to sync DB successfully.`);
        return client;
    }

    _tryPull(){
        if(this.client) {
            this._isExecuteAllowed().then((isAllowed) =>  {
                if(isAllowed) this.pullEmitter.emit('pull');
                else {
                    setTimeout(()=>this.pullEmitter.emit('finish'),this.minInterval); // start the next pull cycle only after the minimum Interval
                }
            })
            .catch((err)=>
                Log.error(`Error while trying to ask for a pull from the DB: ${err}`));
        }
    }

    _isExecuteAllowed(){
        let this2 = this;
        let promise = new Promise(function(resolve,reject){
            let currentTimeStemp = Date.now();
            this2.client.query(updateQuery,[currentTimeStemp, math.sum(currentTimeStemp,-this2.minInterval)], (updateErr, updateRes) => {
                try{
                    if (updateErr)
                        Log.error(`Error while trying to ask for a pull from the DB (Error: ${updateErr.stack})`);
                    else if (updateRes.rowCount === 1)
                        resolve(true);
                    else
                        resolve(false);
                }
                catch(err){
                    reject(err);
                }
            });
        });
        return promise;
    }
}