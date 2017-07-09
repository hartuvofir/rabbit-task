/**
 * Created by asafdavid on 10/12/2015.
 */
import Listener from './listener';
import Sender from './sender';
import Logger from './logger';

export default class Worker {
    constructor(name, conn, queue, router, config, pullingEmitter, options,) {
        this.name = name;
        this.conn = conn;
        this.queue = queue;
        this.router = router;
        this.config = config || Promise.resolve();
        this.options = options || {};
        this.pullingEmitter = pullingEmitter || undefined;

        if (this.options.logger) {
            Logger.setLogger(this.options.logger);
        }
    }

  start() {
    const consumerTag = this.options.consumerTag ? `${this.options.consumerTag}-worker` : undefined;
    this.conn.connect();
    this.conn.on('open', () => {
      Logger.instance.info('[AMQP] channel is open');
      this.config().then(() => {
        const listener = new Listener(this.conn.channel, this.queue, consumerTag,this.pullingEmitter);
        const sender = new Sender(
          this.conn.channel,
          this.options.errExchange,
          this.options.nackExchange,
          this.options.timeoutExchange,
          this.options.timeoutQueueName,
          this.options.queueExpiration
        );
        return { listener, sender };
      }).then((comm) => {
        comm.listener.start();
        comm.listener.on('msg', (msg) => {
          this.router.route(comm.sender, msg);
        });
      });
    });
  }
}
