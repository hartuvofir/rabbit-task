/**
 * Created by asafdavid on 07/12/2015.
 */
// External packages
import amqp from 'amqplib';
import { EventEmitter } from 'events';

import logger from './logger';

const RECONNECTION_TIMEOUT = 1000;
const RETRY_CONNECT_TIMEOUT = 5000;

/**
 * Represent a connection to the AMQP server
 */
export default class Connection extends EventEmitter {
  /**
   * Creates a new connection object
   * @param connectionString
   */
  constructor(connectionString) {
    super();
    this.connectionString = connectionString || 'amqp://localhost';
  }


  /**
   * Connects to the wanted AMQP server and tries to maintain the connection.
   */
  connect() {
    return amqp.connect(this.connectionString).then((conn) => {
      this.conn = conn;
      // Close the connection on process termination
      process.once('SIGINT', () => { conn.close(); });
      logger.instance.info(`[AMQP] connected to ${this.connectionString}`);

      // Opens a channel
      conn.createChannel().then((ch) => {
        this.channel = ch;
        this.emit('open', conn);
      });

      // Handle connection error
      conn.on('error', (err) => {
        if (err.message === 'read ECONNRESET') {
          logger.instance.error('[AMQP] reconnecting');
          setTimeout(() => this.connect(), RECONNECTION_TIMEOUT);
        } else if (err.message !== 'Connection closing') {
          logger.instance.error('[AMQP] conn error', err.message);
          this.emit('error', err);
        }
      });

      conn.on('close', (msg) => {
        this.emit('close');
        if (!!msg && msg !== 'Closed by client' && !msg.match(/Error/)) {
          logger.instance.error('[AMQP] reconnecting');
          setTimeout(() => this.connect(), RECONNECTION_TIMEOUT);
        }
      });
    }, (err) => {
      logger.instance.error('[AMQP] conn error', err.message);
      if (err.message.match(/ECONNREFUSED/)) {
        logger.instance.error('[AMQP] reconnecting');
        setTimeout(() => this.connect(), RETRY_CONNECT_TIMEOUT);
      }
      this.emit('error', err);
    });
  }
}
