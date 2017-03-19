/**
 * Created by matan on 1/5/16.
 */
import _ from 'lodash';

export default class HandlerResponse {
  /**
   * Creates an objects that bundles an extended response that a handlers can return.
   * This allows the handler to control the returned message properties & headers instead of them
   * being automatically generated by the sender based on the original message.
   * The message must obey rabbitMQ headers, properties & payload rules.
   * @param {string|number|[string]|[number]} body - The message main payload
   * @param {object=} [originalMessage] - If passed take default properties, headers & reply queue
   * @param {object} headers - An object containing free headers to send.
   * @param {object} properties - An object containing rabbitMQ headers the handler wishes to send.
   * from it. In case of an overlap with properties/headers this parameters is WEAKER.
   * @constructor
   */
  constructor(body, originalMessage, headers = {}, properties = {}) {
    // Initializes response data members
    this.body = body;
    this.properties = {};
    this.headers = {};
    this.msg = originalMessage;

    // Extract properties from the original messager
    if (originalMessage) {
      this.properties.correlationId = originalMessage.properties.messageId;
      this.headers.topic = originalMessage.headers.topic;
      this.replyTo = originalMessage.properties.replyTo;
    }

    // In case of overlapping fields lodash extend gives priority to values from the right
    // side parameter
    _.extend(this.headers, headers);
    const { replyTo, ...otherProperties } = properties;
    _.extend(this.properties, otherProperties);
    if (replyTo) {
      this.replyTo = replyTo;
    }
  }

  /**
   * Format handler's response as rabbit's options
   * @returns {Object|void|*}
   */
  toRabbitOptions() {
    const options = _.extend({}, this.properties);
    options.headers = _.extend({}, this.headers);
    return options;
  }
}
