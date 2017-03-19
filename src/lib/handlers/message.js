/**
 * Created by asafdavid on 01/03/2017.
 */
import _ from 'lodash';

export default class Message {
  constructor(msg) {
    // Deconstruct msg and assign variables
    const { fields, properties, content } = msg;
    const { context, ...headers } = properties.headers;
    this.fields = fields;
    this.properties = _.omit(properties, 'headers');
    this.headers = headers;
    this.context = context;
    this.content = JSON.parse(content.toString());

    // Expose topic
    this.topic = _.get(msg, 'properties.headers.topic', '');

    // Store the raw message
    this.raw = msg;
  }

  /**
   * Extracts an option object based on rabbit-task message format
   * @param additionalOptions
   * @returns {{}}
   */
  toRabbitOptions(additionalOptions) {
    const headers = this.headers || {};
    headers.topic = this.headers.replyToTopic || this.topic;
    headers.context = this.context || {};
    const correlationId = this.properties.messageId;

    const options = {
      correlationId,
      messageId: correlationId,
      headers,
      ...this.properties,
      ...additionalOptions,
    };

    return options;
  }
}
